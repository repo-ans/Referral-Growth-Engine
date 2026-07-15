-- Links profiles to a GoHighLevel contact and repoints the public
-- referral link at that contact id instead of the internally-generated
-- referral_code. Run after schema.sql, 002_referral_stats.sql, and
-- 003_commission_engine.sql.
--
-- Additive-only: referral_code, generate_referral_code(), and every
-- existing row are left untouched. Pilot accounts created before this
-- migration simply have ghl_contact_id = null, so their referral link
-- won't resolve until they're synced to GHL (out of scope here — no
-- backfill job, this is schema + trigger only).

-- 1. profiles: the GHL contact id -----------------------------------------
-- Populated by the `signup` Server Action (lib/actions/auth.ts), which
-- resolves it via lib/ghl.ts *before* calling supabase.auth.signUp(),
-- then passes it through as auth metadata for handle_new_user() to read.

alter table public.profiles
  add column ghl_contact_id text unique;

-- 2. referral_clicks: add ghl_contact_id, stop requiring referral_code ----
-- New click rows are recorded against ghl_contact_id going forward, so
-- referral_code can no longer be required on this table.

alter table public.referral_clicks
  alter column referral_code drop not null;

alter table public.referral_clicks
  add column ghl_contact_id text
    references public.profiles (ghl_contact_id) on delete cascade;

-- 3. referral_codes view: also expose ghl_contact_id -----------------------
-- app/refer/[code]/route.ts validates against this column before
-- logging a click.

create or replace view public.referral_codes as
  select id, referral_code, ghl_contact_id from public.profiles;

-- 4. Re-scope the "own clicks" policy (from 002) to ghl_contact_id --------

drop policy if exists "Users can view their own referral clicks" on public.referral_clicks;

create policy "Users can view their own referral clicks"
  on public.referral_clicks for select
  to authenticated
  using (
    ghl_contact_id in (
      select ghl_contact_id from public.profiles where id = auth.uid()
    )
  );

-- 5. Auto-create profile trigger: also store ghl_contact_id ---------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  referrer_id uuid;
begin
  if new.raw_user_meta_data ->> 'referred_by_code' is not null then
    select id into referrer_id
    from public.profiles
    where referral_code = new.raw_user_meta_data ->> 'referred_by_code';
  end if;

  insert into public.profiles (id, first_name, last_name, phone, referral_code, ghl_contact_id, referred_by)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    public.generate_referral_code(),
    new.raw_user_meta_data ->> 'ghl_contact_id',
    referrer_id
  );

  return new;
end;
$$;
