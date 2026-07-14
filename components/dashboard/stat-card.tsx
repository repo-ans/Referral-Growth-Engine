import type { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  sub,
  delta,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: { percent: number; goodDirection: "up" | "down" };
}) {
  const deltaIsGood =
    delta && (delta.goodDirection === "up") === delta.percent >= 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {icon}
        </span>
        <span className="text-right text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>

      <div className="mt-1 flex items-center gap-1.5">
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        {delta && (
          <span
            className={
              "inline-flex items-center gap-0.5 rounded px-1 text-xs font-medium " +
              (deltaIsGood
                ? "text-green-700 dark:text-green-500"
                : "text-red-700 dark:text-red-500")
            }
          >
            {delta.percent >= 0 ? "▲" : "▼"} {Math.abs(delta.percent)}%
          </span>
        )}
      </div>
    </div>
  );
}
