import { getProfile, getReferralStats } from "@/lib/dal";
import { percentDelta } from "@/lib/weekly";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyVolumeChart } from "@/components/dashboard/weekly-volume-chart";
import { ReferralsTable } from "@/components/dashboard/referrals-table";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import {
  CursorClickIcon,
  UsersIcon,
  PercentIcon,
  CalendarIcon,
} from "@/components/dashboard/icons";

export default async function DashboardPage() {
  const profile = await getProfile();
  const stats = await getReferralStats();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const referralUrl = profile
    ? `${siteUrl}/refer/${profile.referral_code}`
    : null;

  const clicksDelta = percentDelta(stats.clicksThisWeek, stats.clicksLastWeek);
  const referralsDelta = percentDelta(
    stats.referralsThisWeek,
    stats.referralsLastWeek
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          {profile && (
            <p className="mt-0.5 text-sm text-zinc-500">
              Welcome back, {profile.first_name}
            </p>
          )}
        </div>
        <RefreshButton />
      </div>

      {referralUrl && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Your referral link
          </p>
          <p className="mt-1 font-mono text-sm break-all">{referralUrl}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<CursorClickIcon className="h-4.5 w-4.5" />}
          label="Total Clicks"
          value={stats.clickCount.toLocaleString()}
          sub={`${stats.clicksThisWeek} this week`}
          delta={
            clicksDelta === null
              ? undefined
              : { percent: clicksDelta, goodDirection: "up" }
          }
        />
        <StatCard
          icon={<UsersIcon className="h-4.5 w-4.5" />}
          label="Total Referrals"
          value={stats.referralCount.toLocaleString()}
          sub={`${stats.referralsThisWeek} this week`}
          delta={
            referralsDelta === null
              ? undefined
              : { percent: referralsDelta, goodDirection: "up" }
          }
        />
        <StatCard
          icon={<PercentIcon className="h-4.5 w-4.5" />}
          label="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          sub="clicks → signups"
        />
        <StatCard
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          label="Referrals This Week"
          value={stats.referralsThisWeek.toLocaleString()}
          sub={`${stats.clicksThisWeek} clicks this week`}
        />
      </div>

      <div className="mt-6">
        <WeeklyVolumeChart data={stats.weeklyVolume} />
      </div>

      <div className="mt-6">
        <ReferralsTable referrals={stats.referrals} />
      </div>
    </div>
  );
}
