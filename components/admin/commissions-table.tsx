"use client";

import { useState } from "react";
import { setCommissionStatus, type CommissionStatus } from "@/lib/actions/admin";

type CommissionRow = {
  id: number;
  partnerName: string;
  jobType: string;
  baseAmount: number;
  commissionAmount: number;
  tierMultiplier: number;
  status: CommissionStatus;
  payoutDate: string | null;
  createdAt: string;
};

const STATUS_CLASSES: Record<CommissionStatus, string> = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  approved: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  paid: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  clawed_back: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  new_install: "New Install",
  repair_maintenance: "Repair/Maintenance",
  customer_referral: "Customer Referral",
};

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function CommissionsTable({ commissions }: { commissions: CommissionRow[] }) {
  const [localRows, setLocalRows] = useState(commissions);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  async function transition(row: CommissionRow, nextStatus: CommissionStatus) {
    setRowError(null);
    setPendingId(row.id);
    const result = await setCommissionStatus(row.id, nextStatus);
    setPendingId(null);

    if (!result.ok) {
      setRowError({ id: row.id, message: result.error });
      return;
    }
    setLocalRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: nextStatus,
              payoutDate: nextStatus === "paid" ? new Date().toISOString() : r.payoutDate,
            }
          : r
      )
    );
  }

  function advance(row: CommissionRow) {
    const nextStatus: CommissionStatus | null =
      row.status === "pending" ? "approved" : row.status === "approved" ? "paid" : null;
    if (!nextStatus) return;
    transition(row, nextStatus);
  }

  function clawBack(row: CommissionRow) {
    if (!confirm(`Claw back this $${row.commissionAmount} commission from ${row.partnerName}?`)) {
      return;
    }
    transition(row, "clawed_back");
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-bold text-(--brand-navy)">
          Commissions{" "}
          <span className="ml-1 text-xs font-medium text-zinc-500">
            {localRows.length} total
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Partner</th>
              <th className="px-4 py-2 font-medium">Job Type</th>
              <th className="px-4 py-2 font-medium">Base</th>
              <th className="px-4 py-2 font-medium">Commission</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Payout Date</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {localRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  No commissions yet.
                </td>
              </tr>
            ) : (
              localRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-2.5 font-medium">{r.partnerName}</td>
                  <td className="px-4 py-2.5 text-zinc-500">
                    {JOB_TYPE_LABELS[r.jobType] ?? r.jobType}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{currency(r.baseAmount)}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {currency(r.commissionAmount)}
                    <span className="ml-1 text-xs font-normal text-zinc-400">
                      ×{r.tierMultiplier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize " +
                        STATUS_CLASSES[r.status]
                      }
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">
                    {r.payoutDate
                      ? new Date(r.payoutDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {(r.status === "pending" || r.status === "approved") && (
                        <button
                          type="button"
                          disabled={pendingId === r.id}
                          onClick={() => advance(r)}
                          className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingId === r.id
                            ? "Saving…"
                            : r.status === "pending"
                              ? "Approve"
                              : "Mark Paid"}
                        </button>
                      )}
                      {r.status !== "clawed_back" && (
                        <button
                          type="button"
                          disabled={pendingId === r.id}
                          onClick={() => clawBack(r)}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Claw back
                        </button>
                      )}
                      {r.status === "clawed_back" && (
                        <span className="text-zinc-400">—</span>
                      )}
                    </div>
                    {rowError?.id === r.id && (
                      <p className="mt-1 text-xs text-red-600">{rowError.message}</p>
                    )}
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
