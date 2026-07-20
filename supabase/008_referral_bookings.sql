-- Lets a logged-in user see how many of the people THEY referred have
-- completed the post-signup booking form (app/book, service_appointments —
-- see 007_service_appointments.sql). This file is NOT executed
-- automatically; review it, then run it yourself in the Supabase SQL editor.
--
-- Same reasoning as get_my_referrals() in 002_referral_stats.sql: profiles
-- RLS only allows auth.uid() = id, so a user can't directly query "which
-- profiles have referred_by = me". Rather than add a broader profiles
-- select policy (which would leak referred users' data), expose only the
-- count through a narrow security definer function.

create or replace function public.get_my_referral_bookings_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)
  from public.service_appointments sa
  join public.profiles p on p.id = sa.profile_id
  where p.referred_by = auth.uid();
$$;

grant execute on function public.get_my_referral_bookings_count() to authenticated;
