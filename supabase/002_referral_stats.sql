-- Incremental change on top of schema.sql. Lets a logged-in user see
-- (a) how many clicks their own referral code has, and (b) who
-- registered using it. Run this in the Supabase SQL editor after
-- schema.sql has already been applied.

-- a) Click count -----------------------------------------------------
-- referral_clicks holds no PII (just a code + timestamp), so a plain
-- row-level policy scoped to "clicks on my own code" is enough.

create policy "Users can view their own referral clicks"
  on public.referral_clicks for select
  to authenticated
  using (
    referral_code in (
      select referral_code from public.profiles where id = auth.uid()
    )
  );

-- b) Who registered using my code -------------------------------------
-- profiles rows also hold phone numbers, so rather than grant row
-- access via a select policy (which would leak the referred person's
-- phone to the referrer), expose only the columns needed through a
-- security definer function.

create or replace function public.get_my_referrals()
returns table (first_name text, last_name text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select first_name, last_name, created_at
  from public.profiles
  where referred_by = auth.uid()
  order by created_at desc;
$$;

grant execute on function public.get_my_referrals() to authenticated;
