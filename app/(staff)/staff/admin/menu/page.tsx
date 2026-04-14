import Link from "next/link";

import { ListOrdered, Sandwich } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminMenuPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Gestión de menú"
      description="Administrá categorías e ítems del menú del restaurante."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Categorías" },
        { href: "/staff/admin/menu/items", label: "Ítems" },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/staff/admin/menu/categories">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <ListOrdered className="size-5 text-primary" />
                Categorías
              </CardTitle>
              <CardDescription>
                Definí el orden del menú y el área de preparación.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-primary">
              Abrir categorías
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/admin/menu/items">
          <Card className="h-full transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Sandwich className="size-5 text-primary" />
                Ítems
              </CardTitle>
              <CardDescription>
                Cargá productos, descripción, precio, foto y disponibilidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-primary">
              Abrir ítems
            </CardContent>
          </Card>
        </Link>
      </section>
    </AdminShell>
  );
}
