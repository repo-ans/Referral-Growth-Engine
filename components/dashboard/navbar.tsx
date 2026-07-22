import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { LogOutIcon, CalendarIcon } from "./icons";
import Image from "next/image";
import logo from '@/public/isael logo.webp'
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar({
  showBookButton,
  isAdmin = false,
}: {
  showBookButton: boolean;
  isAdmin?: boolean;
}) {
  return (
    <header className="border-b-2 border-[#e05728] bg-[#eff4f7] dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Image
          className=""
          src={logo.src}
          alt="Isael logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Admin
            </Link>
          )}

          {showBookButton && (
            <Link
              href="/book"
              className="flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
              Book Appointment
            </Link>
          )}

          <ThemeToggle />

          <form action={logout}>
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
