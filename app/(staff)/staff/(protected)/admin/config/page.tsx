import { AdminConfigForm } from "@/components/admin/AdminConfigForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminStaffSession } from "@/lib/auth/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminConfigPage() {
  await requireAdminStaffSession();

  const admin = supabaseAdmin();
  const { data } = await admin
    .from("restaurant_config")
    .select("mp_access_token, mp_public_key")
    .eq("id", 1)
    .maybeSingle();

  return (
    <AdminShell
      activeHref="/staff/admin/config"
      description="Gestiona la identidad del restaurante, los pagos y el flujo operativo."
      title="Configuracion general"
    >
      <AdminConfigForm
        hasAccessToken={Boolean(data?.mp_access_token)}
        mpPublicKey={data?.mp_public_key ?? null}
      />
    </AdminShell>
  );
}
