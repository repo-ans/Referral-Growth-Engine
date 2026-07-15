"use client";

import { useMemo, useState } from "react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

type Referral = { first_name: string; last_name: string; created_at: string };
type TimeFilter = "all" | "week" | "month" | "lastMonth";

const PAGE_SIZE = 10;
const FILTER_LABELS: Record<TimeFilter, string> = {
  all: "All Time",
  week: "This Week",
  month: "This Month",
  lastMonth: "Last Month",
};

function inRange(dateStr: string, filter: TimeFilter) {
  if (filter === "all") return true;

  const date = new Date(dateStr);
  const now = new Date();

  if (filter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }

  if (filter === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return (
    date.getFullYear() === lastMonth.getFullYear() &&
    date.getMonth() === lastMonth.getMonth()
  );
}

export function ReferralsTable({ referrals }: { referrals: Referral[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return referrals.filter((r) => {
      const name = `${r.first_name} ${r.last_name}`.toLowerCase();
      return (q === "" || name.includes(q)) && inRange(r.created_at, filter);
    });
  }, [referrals, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function updateFilter(next: TimeFilter) {
    setFilter(next);
    setPage(1);
  }

  function updateSearch(next: string) {
    setSearch(next);
    setPage(1);
  }

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50 placeholder-slate-400"
          />
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
          {(Object.keys(FILTER_LABELS) as TimeFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => updateFilter(key)}
              className={
                "cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors " +
                (filter === key
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "font-medium text-slate-500 hover:text-slate-700")
              }
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-sm font-bold text-(--brand-navy)">
          Referrals{" "}
          <span className="ml-1 text-xs font-medium text-zinc-500">
            {filtered.length} total
          </span>
        </p>
        <p className="text-xs text-zinc-500">
          Page {currentPage} / {totalPages}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Signed up</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                  No referrals match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={`${r.created_at}-${r.first_name}-${r.last_name}`}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-2.5 font-medium">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      Registered
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-500">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage((p) => p - 1)}
          className="flex cursor-pointer items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" /> Prev
        </button>
        <span>
          {rangeStart}-{rangeEnd} of {filtered.length}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="flex cursor-pointer items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
