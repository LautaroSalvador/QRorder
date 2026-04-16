import { AdminShell } from "@/components/admin/AdminShell";
import { StaffUsersManager } from "@/components/admin/StaffUsersManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminUsersPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Gestión de Personal"
      description='"The art of hospitality begins with the right team."'
      activeHref="/staff/admin/users"
    >
      <StaffUsersManager />
    </AdminShell>
  );
}
