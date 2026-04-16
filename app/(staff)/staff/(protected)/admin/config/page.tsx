import { AdminConfigForm } from "@/components/admin/AdminConfigForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminStaffSession } from "@/lib/auth/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminConfigPage() {
  await requireAdminStaffSession();

  const admin = supabaseAdmin();
  const { data: rawData } = await admin
    .from("restaurant_config")
    .select("mp_access_token, mp_public_key")
    .eq("id", 1)
    .maybeSingle();

  const config = rawData as unknown as { mp_access_token: string | null; mp_public_key: string | null };

  return (
    <AdminShell
      title="Configuración General"
      description="Manage your restaurant identity, payment gateways, and operational flow."
      activeHref="/staff/admin/config"
    >
      <AdminConfigForm
        hasAccessToken={!!config?.mp_access_token}
        mpPublicKey={config?.mp_public_key ?? null}
      />
    </AdminShell>
  );
}
