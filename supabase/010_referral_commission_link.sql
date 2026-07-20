-- Links referrals to the actual referred profile, and enforces the
-- "a referred customer only ever generates one commission for their
-- referrer" rule at the database level. This file is NOT executed
-- automatically; review it, then run it yourself in the Supabase SQL editor.
--
-- referrals previously only had free-text referred_customer_name/phone/
-- email — no stable link back to profiles, so there was no way to
-- reliably answer "has this specific person already been credited".
--
-- The partial unique index is what n8n relies on: it always attempts the
-- insert with `Prefer: resolution=ignore-duplicates`, and this index makes
-- a second attempt for the same referred_profile_id silently no-op
-- (still 201, empty body) instead of erroring or creating a duplicate.
-- That's race-condition-safe without n8n needing its own check-then-insert
-- logic (which repeat webhook deliveries could otherwise slip past).

alter table public.referrals
  add column referred_profile_id uuid references public.profiles (id);

create unique index referrals_referred_profile_id_key
  on public.referrals (referred_profile_id)
  where referred_profile_id is not null;
