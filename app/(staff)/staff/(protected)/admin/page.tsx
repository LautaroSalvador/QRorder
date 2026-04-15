import Link from "next/link";

import {
  ChefHat,
  GlassWater,
  LayoutPanelTop,
  MonitorCheck,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";

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
    href: "/staff/cashier",
    icon: MonitorCheck,
    title: "Caja",
    description: "Ver el estado de todas las mesas desde el salón.",
  },
  {
    href: "/staff/kitchen",
    icon: ChefHat,
    title: "Cocina",
    description: "Entrar a la cola de cocina y seguir los pedidos activos.",
  },
  {
    href: "/staff/bar",
    icon: GlassWater,
    title: "Barra",
    description: "Controlar bebidas pendientes, en preparación y listas.",
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
      description="Desde acá se administran menú, mesas, usuarios, configuración y el acceso a todas las áreas operativas."
      navItems={[
        { href: "/staff/cashier", label: "Salón" },
        { href: "/staff/kitchen", label: "Cocina" },
        { href: "/staff/bar", label: "Barra" },
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
