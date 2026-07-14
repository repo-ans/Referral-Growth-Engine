import { logout } from "@/lib/actions/auth";
import { LogOutIcon } from "./icons";

export function Navbar() {
  return (
    <header className="border-b-2 border-blue-600 bg-white dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            I
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Isael Referral
          </span>
        </div>

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
