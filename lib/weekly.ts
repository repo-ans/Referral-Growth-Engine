// Buckets timestamps into Monday-start weeks, for the dashboard's
// weekly volume chart and week-over-week deltas.

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function lastNWeekStarts(n: number) {
  const current = startOfWeek(new Date());
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(current);
    d.setDate(d.getDate() - (n - 1 - i) * 7);
    return d;
  });
}

export function countByWeek(timestamps: string[], weekStarts: Date[]) {
  return weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return timestamps.filter((ts) => {
      const d = new Date(ts);
      return d >= weekStart && d < weekEnd;
    }).length;
  });
}

// Returns null (skip the badge) when there's no prior-week baseline to
// compare against, rather than a misleading "infinite" percentage.
export function percentDelta(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function weekLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
