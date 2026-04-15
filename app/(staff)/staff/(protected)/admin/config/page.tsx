import { AdminShell } from "@/components/admin/AdminShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminStaffSession } from "@/lib/auth/staff";

export default async function AdminConfigPage() {
  await requireAdminStaffSession();

  return (
    <AdminShell
      title="Configuración"
      description="Esta ruta queda reservada para credenciales de Mercado Pago, propinas y ajustes del restaurante."
      navItems={[
        { href: "/staff/admin/menu/categories", label: "Menú" },
        { href: "/staff/admin/tables", label: "Mesas" },
        { href: "/staff/admin/users", label: "Usuarios" },
        { href: "/staff/admin/config", label: "Config" },
      ]}
      activeHref="/staff/admin/config"
    >
      <Card>
        <CardHeader>
          <CardTitle>Próximo paso</CardTitle>
          <CardDescription>
            La configuración administrativa sigue en la próxima iteración del backbone.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ya quedó lista la base de roles, menú, mesas y usuarios para seguir con la Fase 1.
        </CardContent>
      </Card>
    </AdminShell>
  );
}
