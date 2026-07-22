"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/dashboard/icons";

// Flips the "dark" class on <html> (see app/layout.tsx's blocking init
// script and app/globals.css's @custom-variant) and remembers the choice.
// Starts blank until mounted — the server can't know the class the init
// script set client-side, so rendering an icon before mount would risk a
// hydration mismatch.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
      // eslint-disable-next-line no-empty
    } catch {}
  }

  if (isDark === null) {
    return <div className={"h-8 w-8 " + className} />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 " +
        className
      }
    >
      {isDark ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
    </button>
  );
}
