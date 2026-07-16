import type { ReactNode } from "react";
import { DollarIcon, CheckCircleIcon, CalendarIcon } from "./icons";

type Tier = "bronze" | "silver" | "gold";
type CommissionStatus = "pending" | "approved" | "paid" | "clawed_back";

const TIER_STYLES: Record<Tier, string> = {
  bronze: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  silver: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  gold: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
};

const STATUS_STYLES: Record<CommissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  approved: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  paid: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  clawed_back: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function Tile({
  icon,
  label,
  amount,
}: {
  icon: ReactNode;
  label: string;
  amount: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-(--brand-navy) tabular-nums">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

export function EarningsPanel({
  tier,
  pending,
  approved,
  paid,
  commissions,
}: {
  tier: Tier;
  pending: number;
  approved: number;
  paid: number;
  commissions: {
    commission_amount: number;
    status: CommissionStatus;
    payout_date: string | null;
    created_at: string;
  }[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-(--brand-navy)">Earnings</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${TIER_STYLES[tier]}`}
        >
          {tier} tier
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile icon={<CalendarIcon className="h-4 w-4" />} label="Pending" amount={pending} />
        <Tile icon={<CheckCircleIcon className="h-4 w-4" />} label="Approved" amount={approved} />
        <Tile icon={<DollarIcon className="h-4 w-4" />} label="Paid" amount={paid} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Payout date</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-zinc-400">
                  No commissions yet.
                </td>
              </tr>
            ) : (
              commissions.map((c, i) => (
                <tr
                  key={`${c.created_at}-${i}`}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="py-2.5 pr-4 text-zinc-500">
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 font-medium tabular-nums">
                    {formatCurrency(c.commission_amount)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-500">
                    {c.payout_date
                      ? new Date(c.payout_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
