import { Navbar } from "@/components/dashboard/navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-900">
      <Navbar showBookButton={false} isAdmin />
      {children}
    </div>
  );
}
