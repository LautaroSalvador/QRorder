import { AdminShell } from "@/components/admin/AdminShell";
import { TablesManager } from "@/components/admin/TablesManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminTablesPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Mesas"
      description="Alta, edición y baja de mesas del salón. El layout visual queda para la Fase 4."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menú" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
      ]}
      activeHref="/staff/admin/tables"
    >
      <TablesManager />
    </AdminShell>
  );
}
