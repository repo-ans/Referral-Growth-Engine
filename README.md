# Isael Referral

Referral system for Isael's HVAC repair services (AC, fridge repair). Users
register, get a unique referral link, and can see who signed up through it.

Auth and data are backed by [Supabase](https://supabase.com) (Auth + Postgres).
Booking/job data currently lives in HouseCall Pro, migrating to GoHighLevel.

> **Note on Next.js version**: this project runs Next.js 16, which has some
> breaking changes from earlier versions (e.g. Middleware is now called
> Proxy — see `proxy.ts`). Check `node_modules/next/dist/docs/` before
> assuming APIs match older Next.js knowledge.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy the env example and fill in your Supabase project's URL and anon key
(Supabase dashboard → Settings → API):

```bash
cp .env.local.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Base URL of this app, e.g. `http://localhost:3000` in dev |

### 3. Set up the database

Run the SQL files below **in order**, in the Supabase SQL editor. Nothing in
this repo runs them for you — review before applying.

1. [`supabase/schema.sql`](supabase/schema.sql) — `profiles` and
   `referral_clicks` tables, RLS policies, referral code generator, and a
   trigger that auto-creates a profile (with a fresh referral code) whenever
   someone signs up.
2. [`supabase/002_referral_stats.sql`](supabase/002_referral_stats.sql) —
   lets a logged-in user see their own click count and who registered
   using their link, without exposing other users' phone numbers.

### 4. Configure Supabase Auth redirect URLs

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (or your deployed URL)
- **Redirect URLs**: add `http://localhost:3000/auth/confirm`

This is where email confirmation links send users back to; without it,
signups won't complete.

> Supabase's built-in email sender is rate-limited to a handful of emails
> per hour and meant only for testing. For real use, configure custom SMTP
> under Authentication → Settings → SMTP Settings.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the referral flow works

1. A registered user's referral link is `/refer/[code]`, shown on
   `/dashboard`.
2. Visiting that link logs a click in `referral_clicks`, then redirects to
   `/register?ref=[code]`.
3. The registration form carries the code through as a hidden field. On
   signup, a Postgres trigger on `auth.users` creates the new profile with
   `referred_by` set to the referring user.
4. The referrer's dashboard shows their click count and the list of people
   who signed up through their link.

Conversion tracking (whether a referred signup became a paid job) isn't
built yet — it needs a webhook from HouseCall Pro or GoHighLevel, and is
blocked on the platform migration settling.

## Project structure

```
app/
  register/            Registration page + form
  login/                Login page + form
  dashboard/            Logged-in user's referral link, click count, referrals
  refer/[code]/         Click-tracking redirect route
  auth/confirm/         Exchanges Supabase's email-confirmation code for a session
lib/
  supabase/             Browser/server Supabase clients + proxy session refresh
  actions/auth.ts        Server Actions: signup, login, logout
  definitions.ts         Zod validation schemas
  dal.ts                  Data access layer: session/profile/referral-stats reads
proxy.ts                 Next.js 16 Proxy (formerly Middleware): refreshes auth cookie
supabase/                SQL schema files (run manually, not applied automatically)
```

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [React 19](https://react.dev)
- [Supabase](https://supabase.com) (Auth + Postgres, via `@supabase/ssr`)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Zod](https://zod.dev) for form validation
