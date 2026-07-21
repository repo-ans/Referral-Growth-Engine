"use client";

import { useMemo, useState } from "react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/dashboard/icons";

type CustomerRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  bookedAt: string;
  referredByName: string;
  createdAt: string;
};

const PAGE_SIZE = 15;

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.referredByName.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
            placeholder="Search by name, phone, email, or referrer…"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50 placeholder-slate-400"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Page {currentPage} / {totalPages}
        </p>
      </div>

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <p className="text-sm font-bold text-(--brand-navy)">
          Customers{" "}
          <span className="ml-1 text-xs font-medium text-zinc-500">
            {filtered.length} total
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Booked</th>
              <th className="px-4 py-2 font-medium">Referred by</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  No customers yet.
                </td>
              </tr>
            ) : (
              pageRows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{c.phone}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{c.email}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{c.serviceType}</td>
                  <td className="px-4 py-2.5 text-zinc-500">
                    {new Date(c.bookedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{c.referredByName}</td>
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
