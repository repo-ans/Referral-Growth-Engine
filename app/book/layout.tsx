import Image from "next/image";
import logo from "@/public/isael logo.webp";
import { ThemeToggle } from "@/components/theme-toggle";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-zinc-900">
      <ThemeToggle className="absolute top-4 right-4" />
      <Image
        src={logo.src}
        alt="Isael logo"
        width={100}
        height={20}
        priority
      />
      <div className="mt-8 w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
