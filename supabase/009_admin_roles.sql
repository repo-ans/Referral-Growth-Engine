-- Role-based admin access, replacing the ADMIN_EMAILS env var allow-list.
-- This file is NOT executed automatically; review it, then run it yourself
-- in the Supabase SQL editor.

alter table public.profiles
  add column is_admin boolean not null default false;

-- Hardening while we're touching this: "Users can update their own
-- profile" (schema.sql) has a USING clause but no WITH CHECK / column
-- grants, so as written any authenticated user could already update ANY
-- column on their own row via a direct API call — including, now,
-- is_admin. Postgres column-level privileges are enforced independently
-- of RLS, so this closes that off regardless of policy logic: authenticated
-- can only ever touch the columns a user should legitimately self-edit.
-- The service role (used by lib/supabase/admin.ts for actual admin
-- promotion) ignores grants entirely, so this doesn't affect that path.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- Bootstrap the first admin manually after running this migration:
--   update public.profiles set is_admin = true where id = '<your-user-id>';
-- Find your user id via Supabase Dashboard -> Authentication -> Users,
-- or: select id from auth.users where email = 'you@example.com';
-- From then on, that admin can promote others from /admin.
