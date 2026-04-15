import { CashierView } from "@/components/cashier/CashierView";
import { requireStaffSession } from "@/lib/auth/staff";

export const metadata = {
  title: "Caja · MesaQR",
};

export default async function CashierPage() {
  await requireStaffSession();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
        <p className="text-sm text-muted-foreground">
          Estado del salón en tiempo real. Hacé click en una mesa para ver el detalle.
        </p>
      </div>

      <CashierView />
    </div>
  );
}
