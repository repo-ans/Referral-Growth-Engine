-- Fixes a bug introduced by 004_ghl_contact_linking.sql: the public
-- referral URL (and the `referred_by_code` value threaded through
-- signup) switched to ghl_contact_id, but handle_new_user() was left
-- looking it up against the old referral_code column. Since those are
-- different values for the same profile, the lookup never matched —
-- every signup via a referral link since 004 silently got
-- referred_by = null, regardless of which link they used.

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

  return new;
end;
$$;
