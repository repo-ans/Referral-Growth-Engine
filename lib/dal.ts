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
    .select("first_name, last_name, referral_code")
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

  if (!profile) {
    return emptyStats();
  }

  const supabase = await createClient();

  const [clicksResult, referralsResult] = await Promise.all([
    supabase
      .from("referral_clicks")
      .select("clicked_at")
      .eq("referral_code", profile.referral_code),
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
