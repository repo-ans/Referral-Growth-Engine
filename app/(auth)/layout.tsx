import Image from "next/image";
import logo from '@/public/isael logo.webp'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-zinc-900">
      {/* <BrandMark size="lg" /> */}
      <Image
        className=""
        src={logo.src}
        alt="Isael logo"
        width={100}
        height={20}
        priority
      />
      <div className="mt-8 w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
