import Link from "next/link";

import {
  BarChart2,
  ChefHat,
  GlassWater,
  LayoutPanelTop,
  MonitorCheck,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { DashboardKPIs } from "@/components/admin/DashboardKPIs";
import {
  Card,
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
    description: "Cola de cocina y pedidos activos.",
  },
  {
    href: "/staff/bar",
    icon: GlassWater,
    title: "Barra",
    description: "Bebidas pendientes, en preparación y listas.",
  },
  {
    href: "/staff/admin/users",
    icon: Users,
    title: "Usuarios staff",
    description: "Invitaciones, roles y desactivación de accesos.",
  },
  {
    href: "/staff/admin/reports",
    icon: BarChart2,
    title: "Reportes",
    description: "Ventas, productos más pedidos y tiempos de preparación.",
  },
  {
    href: "/staff/admin/config",
    icon: Settings,
    title: "Configuración",
    description: "Identidad del restaurante, Mercado Pago y propinas.",
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
        { href: "/staff/admin/reports", label: "Reportes" },
        { href: "/staff/admin/config", label: "Config" },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminCards.map(({ description, href, icon: Icon, title }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Indicadores de hoy</h2>
        <DashboardKPIs />
      </section>

      <DashboardCharts />
    </AdminShell>
  );
}

