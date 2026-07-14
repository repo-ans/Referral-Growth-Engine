import { logout } from "@/lib/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { LogOutIcon } from "./icons";

export function Navbar() {
  return (
    <header className="border-b-[3px] border-orange-500 bg-white dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <BrandMark />

        <form action={logout}>
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
}
