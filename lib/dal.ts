import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export const getReferralStats = cache(async () => {
  const profile = await getProfile();

  if (!profile) {
    return { clickCount: 0, referrals: [] as Referral[] };
  }

  const supabase = await createClient();

  const [clicksResult, referralsResult] = await Promise.all([
    supabase
      .from("referral_clicks")
      .select("*", { count: "exact", head: true })
      .eq("referral_code", profile.referral_code),
    supabase.rpc("get_my_referrals"),
  ]);

  return {
    clickCount: clicksResult.count ?? 0,
    referrals: (referralsResult.data ?? []) as Referral[],
  };
});
