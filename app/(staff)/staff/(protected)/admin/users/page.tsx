import { AdminShell } from "@/components/admin/AdminShell";
import { StaffUsersManager } from "@/components/admin/StaffUsersManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminUsersPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Usuarios staff"
      description="Invitá usuarios, ajustá roles y desactivá accesos del equipo."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menú" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
      ]}
      activeHref="/staff/admin/users"
    >
      <StaffUsersManager />
    </AdminShell>
  );
}
