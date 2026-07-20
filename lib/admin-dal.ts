import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

// Hard gate for /admin — redirects anyone whose profiles.is_admin isn't
// true straight back to /dashboard. isAdminUser() itself never redirects
// (the navbar needs a plain boolean for every user), so this is the one
// place that actually enforces access.
export const verifyAdmin = cache(async () => {
  const isAdmin = await isAdminUser();
  if (!isAdmin) redirect("/dashboard");
});

type AdminProfile = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  referred_by: string | null;
  created_at: string;
  is_admin: boolean;
};

type AdminPartner = {
  id: string;
  tier: "bronze" | "silver" | "gold";
  status: "active" | "inactive";
};

type AdminAppointment = { profile_id: string; start_time: string };

type AdminReferral = {
  id: number;
  job_type: "new_install" | "repair_maintenance" | "customer_referral";
};

type AdminCommission = {
  id: number;
  referral_id: number;
  partner_id: string;
  base_amount: number;
  commission_amount: number;
  tier_multiplier: number;
  status: "pending" | "approved" | "paid" | "clawed_back";
  payout_date: string | null;
  created_at: string;
};

// Everything /admin needs, fetched with the service-role client (bypasses
// RLS — see lib/supabase/admin.ts) and merged in JS rather than via
// PostgREST embed syntax, since the data volume here is small and this
// stays readable without figuring out self-referencing FK embed hints
// for profiles.referred_by.
export const getAdminOverview = cache(async () => {
  await verifyAdmin();
  const admin = createAdminClient();

  const [profilesRes, partnersRes, appointmentsRes, referralsRes, commissionsRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, first_name, last_name, phone, referred_by, created_at, is_admin")
        .order("created_at", { ascending: false }),
      admin.from("partners").select("id, tier, status"),
      admin.from("service_appointments").select("profile_id, start_time"),
      admin.from("referrals").select("id, job_type"),
      admin
        .from("commissions")
        .select(
          "id, referral_id, partner_id, base_amount, commission_amount, tier_multiplier, status, payout_date, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

  const profiles = (profilesRes.data ?? []) as AdminProfile[];
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const partnerById = new Map(
    ((partnersRes.data ?? []) as AdminPartner[]).map((p) => [p.id, p])
  );
  const appointmentByProfile = new Map(
    ((appointmentsRes.data ?? []) as AdminAppointment[]).map((a) => [a.profile_id, a])
  );
  const referralById = new Map(
    ((referralsRes.data ?? []) as AdminReferral[]).map((r) => [r.id, r])
  );

  const directory = profiles.map((p) => {
    const referrer = p.referred_by ? profileById.get(p.referred_by) : undefined;
    const partner = partnerById.get(p.id);
    const appointment = appointmentByProfile.get(p.id);

    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      phone: p.phone,
      signedUpAt: p.created_at,
      referredByName: referrer ? `${referrer.first_name} ${referrer.last_name}` : null,
      partnerTier: partner?.tier ?? null,
      partnerStatus: partner?.status ?? null,
      bookedAt: appointment?.start_time ?? null,
      isAdmin: p.is_admin,
    };
  });

  const commissionTotals = new Map<string, { pending: number; approved: number; paid: number }>();
  for (const c of (commissionsRes.data ?? []) as AdminCommission[]) {
    const entry = commissionTotals.get(c.partner_id) ?? { pending: 0, approved: 0, paid: 0 };
    if (c.status === "pending") entry.pending += Number(c.commission_amount);
    if (c.status === "approved") entry.approved += Number(c.commission_amount);
    if (c.status === "paid") entry.paid += Number(c.commission_amount);
    commissionTotals.set(c.partner_id, entry);
  }

  const commissions = ((commissionsRes.data ?? []) as AdminCommission[]).map((c) => {
    const profile = profileById.get(c.partner_id);
    const referral = referralById.get(c.referral_id);

    return {
      id: c.id,
      partnerName: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
      jobType: referral?.job_type ?? "unknown",
      baseAmount: Number(c.base_amount),
      commissionAmount: Number(c.commission_amount),
      tierMultiplier: Number(c.tier_multiplier),
      status: c.status,
      payoutDate: c.payout_date,
      createdAt: c.created_at,
    };
  });

  const partners = ((partnersRes.data ?? []) as AdminPartner[]).map((partner) => {
    const profile = profileById.get(partner.id);
    const totals = commissionTotals.get(partner.id) ?? { pending: 0, approved: 0, paid: 0 };

    return {
      id: partner.id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
      tier: partner.tier,
      status: partner.status,
      ...totals,
    };
  });

  return {
    directory,
    partners,
    commissions,
    totals: {
      totalUsers: profiles.length,
      totalPartners: partners.length,
      totalBookings: appointmentByProfile.size,
      totalCommissionPaid: partners.reduce((sum, p) => sum + p.paid, 0),
    },
  };
});
