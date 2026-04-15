import { CashierView } from "@/components/cashier/CashierView";
import { requireStaffSession } from "@/lib/auth/staff";

export const metadata = {
  title: "Caja · MesaQR",
};

export default async function CashierPage() {
  const session = await requireStaffSession();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
        <p className="text-sm text-muted-foreground">
          Estado del salon en tiempo real. Hace click en una mesa para ver el detalle.
        </p>
      </div>

      <CashierView canEditLayout={session.profile.role === "admin"} />
    </div>
  );
}
