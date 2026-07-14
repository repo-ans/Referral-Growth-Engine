-- Commission engine schema for Isael. Builds on schema.sql +
-- 002_referral_stats.sql (profiles, referral_clicks, referral_codes) —
-- those stay unchanged. This file is NOT executed automatically; review
-- it, then run it yourself in the Supabase SQL editor.
--
-- Scope: schema only. No commission math lives here — tier_multiplier
-- and commission_amount are computed and written by the n8n workflow
-- (Stage 1's paid engine), using the service role key, which bypasses
-- RLS entirely. That's why none of these tables get insert/update
-- policies for `authenticated` below: a partner can read their own
-- rows, but only the service role can write them.

-- 1. Partners ------------------------------------------------------------
-- Extends a profile with the commission-program-specific fields. Not
-- every registered user is a partner — this is a separate opt-in row,
-- created out-of-band (e.g. by an admin or an n8n approval step) once
-- someone is accepted into the paid referral program.

create table public.partners (
  id uuid primary key references public.profiles (id) on delete cascade,
  tier text not null default 'bronze'
    check (tier in ('bronze', 'silver', 'gold')),
  payout_method text
    check (payout_method in ('ach', 'zelle', 'paypal')),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.partners enable row level security;

create policy "Partners can view their own partner record"
  on public.partners for select
  to authenticated
  using (auth.uid() = id);

-- 2. Referrals -------------------------------------------------------------
-- A tracked job/booking tied to a partner, distinct from
-- profiles.referred_by (which only records the signup relationship).
-- hcp_job_id is nullable because a referral can exist before it's
-- matched to a HouseCall Pro job.

create table public.referrals (
  id bigint generated always as identity primary key,
  partner_id uuid not null references public.partners (id),
  hcp_job_id text,
  referred_customer_name text not null,
  referred_customer_phone text,
  referred_customer_email text,
  job_type text not null
    check (job_type in ('new_install', 'repair_maintenance', 'customer_referral')),
  status text not null default 'pending'
    check (status in ('pending', 'booked', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "Partners can view their own referrals"
  on public.referrals for select
  to authenticated
  using (partner_id = auth.uid());

-- 3. Commissions -----------------------------------------------------------
-- One row per payout calculation for a referral. base_amount and
-- commission_amount are numeric (not integer cents) to match n8n's
-- output directly — no rounding/currency decisions made here.

create table public.commissions (
  id bigint generated always as identity primary key,
  referral_id bigint not null references public.referrals (id),
  partner_id uuid not null references public.partners (id),
  base_amount numeric not null,
  commission_amount numeric not null,
  tier_multiplier numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'clawed_back')),
  payout_date timestamptz,
  created_at timestamptz not null default now()
);

alter table public.commissions enable row level security;

create policy "Partners can view their own commissions"
  on public.commissions for select
  to authenticated
  using (partner_id = auth.uid());

-- Deliberately no insert/update/delete policies on any of the three
-- tables above — n8n writes with the service role key, which bypasses
-- RLS. A partner (authenticated role) can only ever read.
--
-- Deliberately no ON DELETE CASCADE from referrals -> partners or
-- commissions -> referrals/partners (both default to Postgres's
-- NO ACTION): unlike partners->profiles, these are financial/audit
-- records, so a partner row shouldn't be deletable out from under
-- referral or commission history.
