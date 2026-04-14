import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminCategoriesPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Categorías"
      description="Listá, creá, editá y eliminá categorías del menú."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Categorías" },
        { href: "/staff/admin/menu/items", label: "Ítems" },
      ]}
      activeHref="/staff/admin/menu/categories"
    >
      <CategoriesManager />
    </AdminShell>
  );
}
