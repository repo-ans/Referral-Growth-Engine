-- Referral system schema for Isael.
--
-- This file is NOT executed automatically. Review it, then run it
-- yourself in the Supabase SQL editor (or `supabase db push` if you
-- adopt the CLI migration workflow).

-- 1. Profiles ----------------------------------------------------------
-- One row per auth.users row. Created automatically by the trigger
-- below right after Supabase Auth signup.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  referral_code text not null unique,
  referred_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Public referral code lookup ----------------------------------------
-- An anonymous visitor hitting /refer/[code] needs to check the code is
-- real before we log a click. Expose only id + referral_code — never
-- first_name/last_name/phone — via a narrow view instead of granting
-- anon access to the profiles table itself.

create view public.referral_codes as
  select id, referral_code from public.profiles;

grant select on public.referral_codes to anon, authenticated;

-- 3. Referral clicks ------------------------------------------------------
-- One row per click (an event log, not a counter) so click volume can
-- be analyzed over time later if needed.

create table public.referral_clicks (
  id bigint generated always as identity primary key,
  referral_code text not null references public.profiles (referral_code) on delete cascade,
  clicked_at timestamptz not null default now()
);

alter table public.referral_clicks enable row level security;

create policy "Anyone can record a referral click"
  on public.referral_clicks for insert
  to anon, authenticated
  with check (true);

-- Deliberately no select policy for anon/authenticated — click logs
-- are internal analytics, readable only via the service role.
-- Deliberately no IP address or user agent columns — this product
-- serves EU customers, and a click-count log doesn't need that PII.

-- 4. Referral code generator ---------------------------------------------
-- 8 chars from a 32-symbol alphabet with ambiguous characters (0/O/1/I)
-- removed, so codes are easy to read aloud or retype.

create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  code_exists boolean;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    select exists(select 1 from public.profiles where referral_code = code) into code_exists;
    exit when not code_exists;
  end loop;

  return code;
end;
$$;

-- 5. Auto-create profile on signup ----------------------------------------
-- Fires right after Supabase Auth inserts a new auth.users row. Reads
-- first_name/last_name/phone/referred_by_code out of the signup call's
-- `options.data` (see lib/actions/auth.ts's `signup` action).

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

  insert into public.profiles (id, first_name, last_name, phone, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    public.generate_referral_code(),
    referrer_id
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
