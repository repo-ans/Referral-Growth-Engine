import { getAdminOverview } from "@/lib/admin-dal";
import { verifySession } from "@/lib/dal";
import { StatCard } from "@/components/dashboard/stat-card";
import { DirectoryTable } from "@/components/admin/directory-table";
import { PartnersTable } from "@/components/admin/partners-table";
import { CommissionsTable } from "@/components/admin/commissions-table";
import { CustomersTable } from "@/components/admin/customers-table";
import {
  UsersIcon,
  CheckCircleIcon,
  CalendarIcon,
  DollarIcon,
} from "@/components/dashboard/icons";

export default async function AdminPage() {
  const user = await verifySession();
  const { directory, partners, commissions, customers, totals } = await getAdminOverview();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight dark:text-slate-100">
        Admin Overview
      </h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Every signed-up user, who referred them, and partner commission status.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<UsersIcon className="h-4.5 w-4.5" />}
          label="Total Users"
          value={totals.totalUsers.toLocaleString()}
          tone="violet"
        />
        <StatCard
          icon={<CheckCircleIcon className="h-4.5 w-4.5" />}
          label="Total Partners"
          value={totals.totalPartners.toLocaleString()}
          tone="orange"
        />
        <StatCard
          icon={<UsersIcon className="h-4.5 w-4.5" />}
          label="Total Customers"
          value={totals.totalCustomers.toLocaleString()}
          tone="blue"
        />
        <StatCard
          icon={<CalendarIcon className="h-4.5 w-4.5" />}
          label="Total Bookings"
          value={totals.totalBookings.toLocaleString()}
          tone="teal"
        />
        <StatCard
          icon={<DollarIcon className="h-4.5 w-4.5" />}
          label="Commission Paid"
          value={totals.totalCommissionPaid.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          })}
          tone="green"
        />
      </div>

      <div className="mt-6">
        <DirectoryTable rows={directory} currentUserId={user.id} />
      </div>

      <div className="mt-6">
        <CustomersTable customers={customers} />
      </div>

      <div className="mt-6">
        <PartnersTable partners={partners} />
      </div>

      <div className="mt-6">
        <CommissionsTable commissions={commissions} />
      </div>
    </div>
  );
}
