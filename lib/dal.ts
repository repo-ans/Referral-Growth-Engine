import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countByWeek, lastNWeekStarts, weekLabel } from "@/lib/weekly";

const WEEKS_SHOWN = 6;

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return data.user;
});

export const getProfile = cache(async () => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, referral_code, ghl_contact_id, referred_by")
    .eq("id", user.id)
    .single();

  return profile;
});

type Referral = {
  first_name: string;
  last_name: string;
  created_at: string;
};

function emptyStats() {
  const weekStarts = lastNWeekStarts(WEEKS_SHOWN);
  return {
    clickCount: 0,
    referralCount: 0,
    conversionRate: 0,
    clicksThisWeek: 0,
    clicksLastWeek: 0,
    referralsThisWeek: 0,
    referralsLastWeek: 0,
    weeklyVolume: weekStarts.map((d) => ({
      label: weekLabel(d),
      clicks: 0,
      referrals: 0,
    })),
    referrals: [] as Referral[],
  };
}

export const getReferralStats = cache(async () => {
  const profile = await getProfile();

  // Pre-GHL-linking accounts (registered before 004_ghl_contact_linking.sql)
  // have no ghl_contact_id, so there's no referral link to have clicks on.
  if (!profile || !profile.ghl_contact_id) {
    return emptyStats();
  }

  const supabase = await createClient();

  const [clicksResult, referralsResult] = await Promise.all([
    supabase
      .from("referral_clicks")
      .select("clicked_at")
      .eq("ghl_contact_id", profile.ghl_contact_id),
    supabase.rpc("get_my_referrals"),
  ]);

  const clickTimestamps = (clicksResult.data ?? []).map((c) => c.clicked_at as string);
  const referrals = (referralsResult.data ?? []) as Referral[];
  const referralTimestamps = referrals.map((r) => r.created_at);

  const weekStarts = lastNWeekStarts(WEEKS_SHOWN);
  const clicksByWeek = countByWeek(clickTimestamps, weekStarts);
  const referralsByWeek = countByWeek(referralTimestamps, weekStarts);

  const weeklyVolume = weekStarts.map((d, i) => ({
    label: weekLabel(d),
    clicks: clicksByWeek[i],
    referrals: referralsByWeek[i],
  }));

  const clickCount = clickTimestamps.length;
  const referralCount = referrals.length;

  return {
    clickCount,
    referralCount,
    conversionRate: clickCount === 0 ? 0 : (referralCount / clickCount) * 100,
    clicksThisWeek: clicksByWeek[clicksByWeek.length - 1],
    clicksLastWeek: clicksByWeek[clicksByWeek.length - 2],
    referralsThisWeek: referralsByWeek[referralsByWeek.length - 1],
    referralsLastWeek: referralsByWeek[referralsByWeek.length - 2],
    weeklyVolume,
    referrals,
  };
});

// Booked/paid job counts from the commission engine (003_commission_engine.sql).
// Only populated once the n8n booked->paid flow starts writing rows —
// until then this always returns zeros, which is correct: nobody has
// booked or paid jobs yet, not an error state.
export const getFunnelStats = cache(async () => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("referrals")
    .select("status")
    .eq("partner_id", user.id);

  const rows = data ?? [];

  return {
    // "Booked" counts the whole funnel from that stage on, so it never
    // reads lower than "paid" (a paid job was booked first).
    totalBooked: rows.filter((r) => r.status === "booked" || r.status === "paid").length,
    totalPaid: rows.filter((r) => r.status === "paid").length,
  };
});

export type PartnerTier = "bronze" | "silver" | "gold";

// Only exists for users the signup flow recognized as a partner (an
// existing GHL contact at registration time — see
// supabase/006_partner_detection.sql). Returns null for everyone else,
// which the dashboard uses to hide partner-only sections entirely
// rather than showing them empty.
export const getPartner = cache(async () => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("partners")
    .select("tier, payout_method, status")
    .eq("id", user.id)
    .maybeSingle();

  return data as {
    tier: PartnerTier;
    payout_method: "ach" | "zelle" | "paypal" | null;
    status: "active" | "inactive";
  } | null;
});

type Commission = {
  commission_amount: number;
  status: "pending" | "approved" | "paid" | "clawed_back";
  payout_date: string | null;
  created_at: string;
};

function emptyEarnings() {
  return { pending: 0, approved: 0, paid: 0, commissions: [] as Commission[] };
}

// Commission totals + history from the commission engine
// (003_commission_engine.sql). Same story as getFunnelStats: the
// numbers are correct, just zero, until n8n starts writing rows.
export const getEarnings = cache(async () => {
  const partner = await getPartner();
  if (!partner) return emptyEarnings();

  const user = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("commissions")
    .select("commission_amount, status, payout_date, created_at")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  const commissions = (data ?? []) as Commission[];
  const sumByStatus = (status: Commission["status"]) =>
    commissions
      .filter((c) => c.status === status)
      .reduce((total, c) => total + Number(c.commission_amount), 0);

  return {
    pending: sumByStatus("pending"),
    approved: sumByStatus("approved"),
    paid: sumByStatus("paid"),
    commissions,
  };
});

// Whether the current user has already been through the post-signup
// booking form (app/book). Deliberately its own table (service_appointments,
// not appointments — this project already has an unrelated appointments
// table), not counted by any stat above — see supabase/007_service_appointments.sql.
export const getAppointment = cache(async () => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_appointments")
    .select("id, start_time")
    .eq("profile_id", user.id)
    .maybeSingle();

  return data as { id: number; start_time: string } | null;
});

// How many of the people THIS user referred have completed a booking —
// via get_my_referral_bookings_count() (supabase/008_referral_bookings.sql),
// a security definer function for the same reason get_my_referrals() is:
// profiles RLS only allows auth.uid() = id, so a plain query for "profiles
// where referred_by = me" isn't possible from the client.
export const getReferralBookingsCount = cache(async () => {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_my_referral_bookings_count");
  return (data as number | null) ?? 0;
});

// Booking is opt-in, not gated — this only decides whether the navbar's
// "Book Appointment" button shows: anyone who came through a referral
// link (referred_by set), regardless of is_partner. That flag only means
// GHL already had a contact matching their phone/email at signup — a
// weak, incidental signal (e.g. an old marketing lead) that shouldn't
// override the explicit "A referred me for service" signal and silently
// lock a genuine customer out of booking. A true partner who happens to
// sign up via another partner's link just sees a harmless extra button.
export const canBookAppointment = cache(async () => {
  const profile = await getProfile();
  if (!profile?.referred_by) return false;

  const appointment = await getAppointment();
  return !appointment;
});

// Non-redirecting check — every dashboard load hits this (to decide
// whether the navbar shows an "Admin" link), so unlike verifySession()
// it must not throw regular users out. The hard gate for /admin itself
// lives in lib/admin-dal.ts's verifyAdmin(), which calls this.
export const isAdminUser = cache(async () => {
  const user = await verifySession();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return !!user.email && adminEmails.includes(user.email.toLowerCase());
});
