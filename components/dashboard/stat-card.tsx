import type { ReactNode } from "react";

const TONE_CLASSES = {
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  violet:
    "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  orange:
    "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  green:
    "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
} as const;

export function StatCard({
  icon,
  label,
  value,
  sub,
  delta,
  tone = "slate",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: { percent: number; goodDirection: "up" | "down" };
  tone?: keyof typeof TONE_CLASSES;
}) {
  const deltaIsGood =
    delta && (delta.goodDirection === "up") === delta.percent >= 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${TONE_CLASSES[tone]}`}
        >
          {icon}
        </span>
        <span className="text-right text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-(--brand-navy) tabular-nums">
        {value}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        {delta && (
          <span
            className={
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold " +
              (deltaIsGood
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400")
            }
          >
            {delta.percent >= 0 ? "▲" : "▼"} {Math.abs(delta.percent)}%
          </span>
        )}
      </div>
    </div>
  );
}
