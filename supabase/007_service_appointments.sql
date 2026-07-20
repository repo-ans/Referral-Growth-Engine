-- Appointment booking for referred customers. Builds on schema.sql +
-- 004_ghl_contact_linking.sql (profiles.ghl_contact_id) + 006_partner_detection.sql
-- (partners). This file is NOT executed automatically; review it, then run it
-- yourself in the Supabase SQL editor.
--
-- Named service_appointments, not appointments — this Supabase project
-- already has an unrelated public.appointments table with real data.
-- Do not rename this table to `appointments`.
--
-- Deliberately isolated from referral_clicks / profiles.referred_by /
-- referrals / commissions: this table is never read by any lib/dal.ts stat
-- function, so booking an appointment can't skew the dashboard's referral
-- or funnel numbers.

create table public.service_appointments (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  ghl_appointment_id text,
  ghl_contact_id text not null,
  service_type text not null,
  urgency text not null
    check (urgency in ('emergency', 'today', 'this-week', 'flexible')),
  address text,
  city text,
  state text,
  postal_code text not null,
  notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.service_appointments enable row level security;

create policy "Users can view their own service appointments"
  on public.service_appointments for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Users can insert their own service appointment"
  on public.service_appointments for insert
  to authenticated
  with check (profile_id = auth.uid());
