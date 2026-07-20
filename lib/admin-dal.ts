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

type AdminCommission = {
  partner_id: string;
  status: "pending" | "approved" | "paid" | "clawed_back";
  commission_amount: number;
};

// Everything /admin needs, fetched with the service-role client (bypasses
// RLS — see lib/supabase/admin.ts) and merged in JS rather than via
// PostgREST embed syntax, since the data volume here is small and this
// stays readable without figuring out self-referencing FK embed hints
// for profiles.referred_by.
export const getAdminOverview = cache(async () => {
  await verifyAdmin();
  const admin = createAdminClient();

  const [profilesRes, partnersRes, appointmentsRes, commissionsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, phone, referred_by, created_at, is_admin")
      .order("created_at", { ascending: false }),
    admin.from("partners").select("id, tier, status"),
    admin.from("service_appointments").select("profile_id, start_time"),
    admin.from("commissions").select("partner_id, status, commission_amount"),
  ]);

  const profiles = (profilesRes.data ?? []) as AdminProfile[];
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const partnerById = new Map(
    ((partnersRes.data ?? []) as AdminPartner[]).map((p) => [p.id, p])
  );
  const appointmentByProfile = new Map(
    ((appointmentsRes.data ?? []) as AdminAppointment[]).map((a) => [a.profile_id, a])
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
    totals: {
      totalUsers: profiles.length,
      totalPartners: partners.length,
      totalBookings: appointmentByProfile.size,
      totalCommissionPaid: partners.reduce((sum, p) => sum + p.paid, 0),
    },
  };
});
