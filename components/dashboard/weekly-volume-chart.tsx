"use client";

import { useState } from "react";
import { TableIcon, ChartIcon } from "./icons";

type WeekPoint = { label: string; clicks: number; referrals: number };

function niceMax(value: number) {
  if (value <= 5) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

export function WeeklyVolumeChart({ data }: { data: WeekPoint[] }) {
  const [showTable, setShowTable] = useState(false);
  const max = niceMax(Math.max(1, ...data.flatMap((d) => [d.clicks, d.referrals])));
  const ticks = [max, Math.round(max / 2), 0];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">
          Clicks &amp; Referrals — Weekly Volume
        </h2>
        <div className="flex items-center gap-4">
          <Legend />
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {showTable ? (
              <>
                <ChartIcon className="h-3.5 w-3.5" /> Chart view
              </>
            ) : (
              <>
                <TableIcon className="h-3.5 w-3.5" /> Table view
              </>
            )}
          </button>
        </div>
      </div>

      {showTable ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="py-2 font-medium">Week of</th>
              <th className="py-2 font-medium">Clicks</th>
              <th className="py-2 font-medium">Referrals</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{d.label}</td>
                <td className="py-2 tabular-nums">{d.clicks}</td>
                <td className="py-2 tabular-nums">{d.referrals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6 flex gap-3">
          <div className="flex h-44 flex-col justify-between text-right text-xs text-zinc-400 tabular-nums">
            {ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

          <div className="flex h-44 flex-1 items-end gap-4 border-l border-zinc-200 pl-3 dark:border-zinc-800">
            {data.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end justify-center gap-[3px]">
                  <Bar value={d.clicks} max={max} color="var(--chart-clicks)" label="Clicks" />
                  <Bar value={d.referrals} max={max} color="var(--chart-referrals)" label="Referrals" />
                </div>
                <span className="text-[11px] text-zinc-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const heightPct = max === 0 ? 0 : (value / max) * 100;

  return (
    <div className="group/bar relative flex h-full w-3.5 items-end justify-center">
      <span
        className="pointer-events-none absolute -top-6 rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover/bar:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {label}: {value}
      </span>
      <div
        className="w-full rounded-t-[4px]"
        style={{
          height: `${Math.max(heightPct, value > 0 ? 2 : 0)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: "var(--chart-clicks)" }}
        />
        Clicks
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: "var(--chart-referrals)" }}
        />
        Referrals
      </span>
    </div>
  );
}
