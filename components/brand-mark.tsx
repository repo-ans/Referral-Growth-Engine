const SIZES = {
  sm: { badge: "h-9 w-9 text-base", grande: "text-sm", sub: "text-[11px]" },
  lg: { badge: "h-12 w-12 text-xl", grande: "text-lg", sub: "text-xs" },
} as const;

export function BrandMark({ size = "sm" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600 font-bold text-white ${s.badge}`}
      >
        G
      </span>
      <span className="leading-tight">
        <span
          className={`block font-extrabold tracking-tight text-(--brand-navy) ${s.grande}`}
        >
          GRANDE
        </span>
        <span
          className={`block font-bold tracking-wide text-orange-600 dark:text-orange-400 ${s.sub}`}
        >
          AIR SOLUTIONS
        </span>
      </span>
    </div>
  );
}
