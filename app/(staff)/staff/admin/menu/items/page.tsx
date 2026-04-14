import { AdminShell } from "@/components/admin/AdminShell";
import { MenuItemsManager } from "@/components/admin/MenuItemsManager";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminMenuItemsPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Ítems del menú"
      description="Gestioná productos, precios, descripciones, disponibilidad y fotos."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Categorías" },
        { href: "/staff/admin/menu/items", label: "Ítems" },
      ]}
      activeHref="/staff/admin/menu/items"
    >
      <MenuItemsManager />
    </AdminShell>
  );
}
