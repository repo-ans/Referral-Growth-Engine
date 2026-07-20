import { Navbar } from "@/components/dashboard/navbar";
import { canBookAppointment, isAdminUser } from "@/lib/dal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showBookButton, isAdmin] = await Promise.all([
    canBookAppointment(),
    isAdminUser(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-900">
      <Navbar showBookButton={showBookButton} isAdmin={isAdmin} />
      {children}
    </div>
  );
}
