import Link from "next/link";

import { LayoutPanelTop, Settings, UtensilsCrossed, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminStaffSession } from "@/lib/auth/staff";

const adminCards = [
  {
    href: "/staff/admin/menu/categories",
    icon: UtensilsCrossed,
    title: "Menú",
    description: "Categorías e ítems con fotos y disponibilidad.",
  },
  {
    href: "/staff/admin/tables",
    icon: LayoutPanelTop,
    title: "Mesas",
    description: "Alta, edición y baja del salón base.",
  },
  {
    href: "/staff/admin/users",
    icon: Users,
    title: "Usuarios staff",
    description: "Invitaciones, roles y desactivación de accesos.",
  },
  {
    href: "/staff/admin/config",
    icon: Settings,
    title: "Configuración",
    description: "Reservado para la siguiente parte del backbone admin.",
  },
];

export default async function AdminPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Panel administrativo"
      description="Desde acá se administran menú, mesas, usuarios y configuración del restaurante."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menú" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
        { href: "/staff/admin/config", label: "Config" },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map(({ description, href, icon: Icon, title }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Icon className="size-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-primary">
                Abrir sección
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </AdminShell>
  );
}
