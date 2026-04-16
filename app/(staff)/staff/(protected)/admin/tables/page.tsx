import { AdminShell } from "@/components/admin/AdminShell";
import { TablesManager } from "@/components/admin/TablesManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminTablesPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Plano de Sala"
      description="Gestiona la disposición, capacidad y códigos QR de tus mesas."
      activeHref="/staff/admin/tables"
    >
      <TablesManager />
    </AdminShell>
  );
}
