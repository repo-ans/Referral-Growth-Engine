-- Fixes 010_referral_commission_link.sql: PostgREST's on_conflict-based
-- upsert (the n8n "Insert Referral" node's Prefer: resolution=ignore-duplicates)
-- needs a genuine unique constraint to infer the conflict target from — it
-- can't use a PARTIAL unique index, which is what 010 created. Postgres
-- rejects it with 42P10 ("no unique or exclusion constraint matching the
-- ON CONFLICT specification"). Run this after 010.
--
-- The partial WHERE clause was never actually needed: Postgres's standard
-- UNIQUE constraint already treats NULL as distinct from every other NULL,
-- so rows with no referred_profile_id (e.g. a legacy/manual referral not
-- linked to a signed-up profile) can still repeat freely under a plain,
-- non-partial unique constraint — only actual non-null values are
-- deduplicated, which is exactly the "one commission per referred
-- customer, ever" rule this exists to enforce.

drop index if exists public.referrals_referred_profile_id_key;

alter table public.referrals
  add constraint referrals_referred_profile_id_key unique (referred_profile_id);
