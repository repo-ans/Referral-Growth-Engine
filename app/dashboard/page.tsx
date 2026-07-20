import QRCode from "qrcode";
import {
  getProfile,
  getReferralStats,
  getFunnelStats,
  getPartner,
  getEarnings,
  getReferralBookingsCount,
} from "@/lib/dal";
import { percentDelta } from "@/lib/weekly";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyVolumeChart } from "@/components/dashboard/weekly-volume-chart";
import { ReferralsTable } from "@/components/dashboard/referrals-table";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { ReferralLinkReveal } from "@/components/dashboard/referral-link-reveal";
import { EarningsPanel } from "@/components/dashboard/earnings-panel";
import {
  CursorClickIcon,
  UsersIcon,
  PercentIcon,
  CalendarIcon,
  CheckCircleIcon,
  DollarIcon,
} from "@/components/dashboard/icons";

export default async function DashboardPage() {
  const profile = await getProfile();
  const partner = await getPartner();
  const stats = await getReferralStats();
  const funnel = await getFunnelStats();
  const referralBookingsCount = await getReferralBookingsCount();
  const earnings = partner ? await getEarnings() : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const referralUrl = profile?.ghl_contact_id
    ? `${siteUrl}/refer/${profile.ghl_contact_id}`
    : null;
  const qrCodeDataUrl = referralUrl
    ? await QRCode.toDataURL(referralUrl, { margin: 1, width: 256 })
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Referral Dashboard
          </h1>
          {profile && (
            <p className="mt-0.5 text-sm text-zinc-500">
              Welcome back, {profile.first_name}
            </p>
          )}
        </div>
        <RefreshButton />
      </div>

      {referralUrl && qrCodeDataUrl && (
        <ReferralLinkReveal referralUrl={referralUrl} qrCodeDataUrl={qrCodeDataUrl} />
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<CursorClickIcon className="h-4.5 w-4.5" />}
          label="Total Clicks"
          value={stats.clickCount.toLocaleString()}
          sub={`${stats.clicksThisWeek} this week`}
          tone="blue"
          delta={
            clicksDelta === null
              ? undefined
              : { percent: clicksDelta, goodDirection: "up" }
          }
        />
        {/* <StatCard
          icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
          label="Total Booked"
          value={funnel.totalBooked.toLocaleString()}
          sub="jobs booked"
          tone="orange"
        />
        <StatCard
          icon={<DollarIcon className="h-4.5 w-4.5" />}
          label="Total Paid"
          value={funnel.totalPaid.toLocaleString()}
          sub="invoices paid"
          tone="green"
        /> */}
        <StatCard
          icon={<UsersIcon className="h-4.5 w-4.5" />}
          label="Total Referrals"
          value={stats.referralCount.toLocaleString()}
          sub={`${stats.referralsThisWeek} this week`}
          tone="violet"
          delta={
            referralsDelta === null
              ? undefined
              : { percent: referralsDelta, goodDirection: "up" }
          }
        />
        <StatCard
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          label="Referred Bookings"
          value={referralBookingsCount.toLocaleString()}
          sub="of your referrals"
          tone="green"
        />
        <StatCard
          icon={<PercentIcon className="h-4.5 w-4.5" />}
          label="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          sub="clicks → signups"
          tone="teal"
        />
        <StatCard
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          label="Referrals This Week"
          value={stats.referralsThisWeek.toLocaleString()}
          sub={`${stats.clicksThisWeek} clicks this week`}
          tone="slate"
        />
      </div>

      {partner && earnings && (
        <div className="mt-6">
          <EarningsPanel
            tier={partner.tier}
            pending={earnings.pending}
            approved={earnings.approved}
            paid={earnings.paid}
            commissions={earnings.commissions}
          />
        </div>
      )}

      <div className="mt-6">
        <WeeklyVolumeChart data={stats.weeklyVolume} />
      </div>

      <div className="mt-6">
        <ReferralsTable referrals={stats.referrals} />
      </div>

      <footer className="mt-10 border-t border-zinc-200 py-4 text-xs text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} Grande Air Solutions · Austin, TX ·
        Residential HVAC
      </footer>
    </div>
  );
}
