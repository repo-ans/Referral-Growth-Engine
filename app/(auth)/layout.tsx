import Image from "next/image";
import logo from '@/public/isael logo.webp'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-linear-to-b from-slate-800 via-slate-900 to-slate-950 px-6 py-16">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col items-center bg-[#eff4f7] px-6 pt-8 pb-6">
          <Image
            src={logo.src}
            alt="Isael logo"
            width={120}
            height={24}
            priority
          />
        </div>
        <div className="px-6 py-6">
          {children}
          <p className="mt-6 text-center text-xs text-zinc-400">
            Powered by Grande Air Solutions
          </p>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">
        Designed &amp; Developed by{" "}
        <span className="font-semibold text-orange-400">
          © {new Date().getFullYear()} Aniya Network Solutions Inc.
        </span>
      </p>
    </div>
  );
}
