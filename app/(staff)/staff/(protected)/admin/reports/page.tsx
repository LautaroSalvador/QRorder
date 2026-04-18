import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsView } from "@/components/admin/reports/ReportsView";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminReportsPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Reportes"
      description="Analiza las ventas y el rendimiento del restaurante."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menu" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
        { href: "/staff/admin/reports", label: "Reportes" },
      ]}
      activeHref="/staff/admin/reports"
    >
      <ReportsView />
    </AdminShell>
  );
}
