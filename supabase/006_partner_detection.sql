-- Partner detection at signup. Per the updated spec: registration still
-- happens through our own /register form (not a GHL-hosted form, and
-- no HCP integration — GHL is the sole source of truth). The backend
-- checks the registrant's phone/email against GHL first:
--
--   - Contact already exists in GHL (e.g. one of the realtors manually
--     onboarded there during Stage 0)  -> they're a partner. Their
--     existing ghl_contact_id is reused, and this trigger also creates
--     a public.partners row for them.
--   - No existing contact              -> a fresh GHL contact is
--     created for them (lib/ghl.ts), and they're just a regular
--     signup: profile only, no partners row.
--
-- See lib/actions/auth.ts (`signup`) and lib/ghl.ts
-- (`resolveGhlContactId`'s `isExistingContact`) for the application
-- side of this — this migration only updates the trigger to act on the
-- `is_partner` flag it now receives in auth metadata.

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
    where ghl_contact_id = new.raw_user_meta_data ->> 'referred_by_code';
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

  if (new.raw_user_meta_data ->> 'is_partner')::boolean is true then
    insert into public.partners (id) values (new.id);
  end if;

  return new;
end;
$$;
