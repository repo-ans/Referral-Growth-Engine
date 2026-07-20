type PartnerRow = {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
  status: "active" | "inactive";
  pending: number;
  approved: number;
  paid: number;
};

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function PartnersTable({ partners }: { partners: PartnerRow[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm font-bold text-(--brand-navy)">
          Partners{" "}
          <span className="ml-1 text-xs font-medium text-zinc-500">
            {partners.length} total
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Pending</th>
              <th className="px-4 py-2 font-medium">Approved</th>
              <th className="px-4 py-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  No partners yet.
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-zinc-500 capitalize">{p.tier}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (p.status === "active"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{currency(p.pending)}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{currency(p.approved)}</td>
                  <td className="px-4 py-2.5 font-medium">{currency(p.paid)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
