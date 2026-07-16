import { logout } from "@/lib/actions/auth";
import { LogOutIcon } from "./icons";
import Image from "next/image";
import logo from '@/public/isael logo.webp'

export function Navbar() {
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
    </header>
  );
}
