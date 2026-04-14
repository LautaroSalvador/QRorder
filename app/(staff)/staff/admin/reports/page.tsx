import { AdminShell } from "@/components/admin/AdminShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminReportsPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Reportes"
      description="La base administrativa ya permite seguir con reportes en la próxima fase."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menú" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
        { href: "/staff/admin/reports", label: "Reportes" },
      ]}
      activeHref="/staff/admin/reports"
    >
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Esta ruta queda reservada para ventas, productos más vendidos y tiempos promedio.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          En Fase 1 dejamos resuelto el backbone de datos para que esa capa se pueda construir sin rehacer estructura.
        </CardContent>
      </Card>
    </AdminShell>
  );
}
