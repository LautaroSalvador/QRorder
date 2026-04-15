import { KitchenKanban } from "@/components/kitchen/KitchenKanban";
import { requireStaffSession } from "@/lib/auth/staff";

export const metadata = {
  title: "Cola de cocina · MesaQR",
};

export default async function KitchenPage() {
  await requireStaffSession();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cola de cocina</h1>
        <p className="text-sm text-muted-foreground">
          Ítems pendientes, en preparación y listos del área de cocina.
        </p>
      </div>

      <KitchenKanban />
    </div>
  );
}
