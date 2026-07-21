# Test Cases — Referral → Booking → Commission Lifecycle

This document walks through the full lifecycle this project supports, end to
end: a partner (A) refers a customer (B), B signs up, B optionally books a
service appointment, B pays for a completed job, and A earns a commission
that an admin can approve and pay out.

Each test case has **Preconditions** (what needs to be true before you start),
**Steps** (what to do), and **Expected Result** (what should happen if it's
working). Run them in order — later ones build on earlier ones.

## Environment

- App: `https://<your-live-domain>` (the link submitted alongside this doc)
- Database: Supabase project backing the app
- External systems: GoHighLevel (GHL) for contacts/calendar/opportunities,
  HouseCall Pro (HCP) for job/invoice events, n8n for the automation between
  HCP, GHL, and Supabase

---

## TC-01 — Partner referral link works

**Preconditions:** A partner account ("A") exists and is logged in.

**Steps:**
1. Log in as A, go to `/dashboard`.
2. Click "Generate Link" under "Your referral link".
3. Copy the link (format: `/refer/<code>`) and open it in an incognito window.

**Expected Result:** The incognito window redirects to `/register`. Back on
A's dashboard (refresh), "Total Clicks" has incremented by 1.

---

## TC-02 — Referred signup creates the right relationship

**Preconditions:** TC-01 done; you're on the `/register` page from the
referral link, in the incognito window.

**Steps:**
1. Fill in first name, last name, a real email you can access, phone, and a
   password. Submit.
2. You should land on `/register/check-email`.
3. Open the confirmation email and click the link.

**Expected Result:** You're redirected to `/book` (the booking form) or
`/dashboard`, and you're logged in as the new user (B). In Supabase, `select
referred_by from profiles where id = '<B's id>'` returns A's user id.

---

## TC-03 — Booking is optional, not forced

**Preconditions:** TC-02 done; B is logged in.

**Steps:**
1. If you landed on `/book`, skip it (navigate directly to `/dashboard`
   instead — e.g. by typing the URL).
2. On `/dashboard`, look at the navbar.

**Expected Result:** You reach `/dashboard` without being blocked. A
**"Book Appointment"** button is visible in the navbar (since B hasn't
booked yet).

---

## TC-04 — Booking form completes and creates a real appointment

**Preconditions:** B is logged in, hasn't booked yet.

**Steps:**
1. Click "Book Appointment" in the navbar.
2. Step 1: pick a service type and urgency, fill in address/ZIP. Continue.
3. Step 2: pick a day and an available time slot. Continue.
4. Step 3: check both consent boxes, click "Book My Appointment".

**Expected Result:** A confirmation screen appears ("You're on the
schedule!"). In Supabase, a new row exists in `service_appointments` for
B's `profile_id`. In GHL, a calendar appointment exists for B's contact.
Back on `/dashboard`, the "Book Appointment" button is now gone (B has
booked).

---

## TC-05 — Partner dashboard reflects the referral and booking

**Preconditions:** TC-01–04 done.

**Steps:**
1. Log in as A, go to `/dashboard`.

**Expected Result:** "Total Referrals" includes B. "Referred Bookings"
shows at least 1 (B has completed the booking form).

---

## TC-06 — A completed, paid job generates exactly one commission

**Preconditions:** TC-01–02 done (B is a referred signup — booking from
TC-04 isn't required for this one, since payment tracking is independent
of the booking form). A has a `partners` row (tier set).

**Steps:**
1. In HouseCall Pro, mark a job for B's contact info as paid (or trigger
   the `invoice-paid` webhook manually with B's phone/email in the n8n test
   tool, using real production data — not the test payload).
2. Wait for the n8n workflow to run.

**Expected Result:** In Supabase, exactly one new row appears in
`referrals` (`status = 'paid'`, `referred_profile_id` = B's profile id,
`partner_id` = A's id) and exactly one matching row in `commissions`
(`status = 'pending'`, `commission_amount` calculated from the job type and
A's tier).

---

## TC-07 — The one-time-referral rule holds on repeat business

**Preconditions:** TC-06 already completed once for B.

**Steps:**
1. Mark a **second**, separate job for the same customer B as paid in
   HouseCall Pro.
2. Wait for n8n to run again.

**Expected Result:** **No new row** appears in `referrals` or `commissions`
for B. A already got credit for B once; repeat business from the same
customer generates nothing further. (This is enforced by a database unique
constraint, not just app logic — it holds even if the webhook fires twice
for the same event.)

---

## TC-08 — Admin can see the whole picture

**Preconditions:** An admin account exists (`profiles.is_admin = true`).
TC-01–06 done.

**Steps:**
1. Log in as the admin, go to `/dashboard`, click "Admin" in the navbar.

**Expected Result:** On `/admin`:
- **Directory** table lists B with "Referred by" showing A's name.
- **Partners** table lists A with tier "bronze" (or whatever was set) and a
  "Pending" commission total matching TC-06's `commission_amount`.
- **Commissions** table has one row for A, status "pending", with an
  "Approve" button.

---

## TC-09 — Admin approves and pays a commission, partner sees it

**Preconditions:** TC-08 done, a pending commission exists.

**Steps:**
1. On `/admin`'s Commissions table, click "Approve" on A's commission row.
2. Click "Mark Paid" once it shows "approved".
3. Log in as A, go to `/dashboard`.

**Expected Result:** The commission's status updates to "paid" with a
payout date in `/admin`. On A's `/dashboard`, the Earnings panel's "Paid"
total reflects the commission amount.

---

## TC-10 — Non-referred / direct signups are unaffected

**Preconditions:** None.

**Steps:**
1. Sign up a brand-new account directly at `/register` (no referral link —
   navigate to it directly, not via `/refer/<code>`).
2. Log in.

**Expected Result:** No "Book Appointment" button appears in the navbar
(this account has no referrer, so the booking flow isn't offered). No
`referrals`/`commissions` rows are ever created for this account regardless
of any jobs paid under their name, since there's no partner to attribute
them to.

---

## Notes for whoever runs these

- Tests that touch HouseCall Pro/GHL make **real** API calls — there's no
  sandbox mode. Use dedicated test contacts, not real customers.
- If a step fails, check (in this order): the relevant Supabase table
  directly via the SQL editor, the n8n execution log for the workflow run,
  then the app's own behavior — this narrows down which layer broke.
