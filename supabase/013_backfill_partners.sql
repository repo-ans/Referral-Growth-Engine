-- Backfills partners rows for existing profiles that signed up before
-- every /register signup became a partner (lib/actions/auth.ts). Without
-- this, accounts created under the old GHL-existing-contact rule are
-- stuck with a working referral link that can never earn a commission —
-- Find Partner in the n8n commission flow finds nothing for them. This
-- file is NOT executed automatically; review it, then run it yourself in
-- the Supabase SQL editor.

insert into public.partners (id)
select p.id
from public.profiles p
left join public.partners pt on pt.id = p.id
where pt.id is null;
