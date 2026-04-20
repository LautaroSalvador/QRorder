import { AdminConfigForm } from "@/components/admin/AdminConfigForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminStaffSession } from "@/lib/auth/staff";
import { getRestaurantConfigSnapshot } from "@/lib/restaurant-config";

export default async function AdminConfigPage() {
  await requireAdminStaffSession();

  const config = await getRestaurantConfigSnapshot();

  return (
    <AdminShell
      activeHref="/staff/admin/config"
      description="Gestiona la identidad del restaurante, los pagos y el flujo operativo."
      title="Configuracion general"
    >
      <AdminConfigForm
        barNotificationsEnabled={config.soundSettings.barNotificationsEnabled}
        hasAccessToken={config.hasAccessToken}
        hasPublicKey={config.hasPublicKey}
        kitchenNotificationsEnabled={config.soundSettings.kitchenNotificationsEnabled}
        restaurantName={config.name}
        tipOptions={config.tipOptions}
      />
    </AdminShell>
  );
}
