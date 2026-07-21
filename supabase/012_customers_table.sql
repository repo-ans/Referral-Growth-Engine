-- Anonymous customer bookings. B (the end customer A refers) never gets a
-- Supabase Auth account or a profiles row — they're a GHL contact/customer,
-- not a referral-program participant. This table holds their booking data,
-- admin-visible only (via the service-role client, same as /admin's other
-- tables). This file is NOT executed automatically; review it, then run it
-- yourself in the Supabase SQL editor.

create table public.customers (
  id bigint generated always as identity primary key,
  referred_by uuid not null references public.profiles (id) on delete cascade,
  ghl_contact_id text not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  address text,
  city text,
  state text,
  postal_code text not null,
  service_type text not null,
  urgency text not null
    check (urgency in ('emergency', 'today', 'this-week', 'flexible')),
  notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

-- The public booking form (app/refer/[code]) has no session at all — this
-- is the one table in the project anonymous visitors can write to besides
-- referral_clicks. Deliberately no select policy: nobody reads this table
-- directly except the service-role client in lib/admin-dal.ts, and
-- partners only ever see it in aggregate via get_my_customers() below.
create policy "Anyone can submit a booking"
  on public.customers for insert
  to anon, authenticated
  with check (true);

-- 1. Link referrals to a customers row -------------------------------------
-- referred_profile_id (010_referral_commission_link.sql) still references
-- profiles and is untouched — that's for the old authenticated-booking /
-- partner-to-partner case. This is the new, separate column the n8n
-- commission flow now targets for real end customers.

alter table public.referrals
  add column referred_customer_id bigint references public.customers (id);

-- Same reasoning as 011_fix_referral_unique_constraint.sql: a plain
-- (non-partial) unique constraint, not a partial index — PostgREST's
-- on_conflict-based upsert can't target a partial index, and a full
-- unique constraint already allows unlimited NULLs (legacy/partner-to-
-- partner referrals with no linked customer), only deduplicating actual
-- non-null values. This is what enforces "one commission per referred
-- customer, ever" for the new anonymous-booking flow.
alter table public.referrals
  add constraint referrals_referred_customer_id_key unique (referred_customer_id);

-- 2. Let a partner see the customers they referred --------------------------
-- Same reasoning as get_my_referrals() in 002_referral_stats.sql: a partner
-- can't directly query "customers where referred_by = me" (no select policy
-- above), so expose only the columns a dashboard needs via a narrow
-- security definer function instead of a broader table policy.

create or replace function public.get_my_customers()
returns table (first_name text, last_name text, service_type text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select first_name, last_name, service_type, created_at
  from public.customers
  where referred_by = auth.uid()
  order by created_at desc;
$$;

grant execute on function public.get_my_customers() to authenticated;
