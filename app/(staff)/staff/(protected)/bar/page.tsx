import { BarKanban } from "@/components/bar/BarKanban";
import { requireStaffSession } from "@/lib/auth/staff";

export default async function BarPage() {
  await requireStaffSession();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Barra</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Gestión de bebidas en preparación, listas para salir y entregas a mesa.
        </p>
      </div>
      <BarKanban />
    </div>
  );
}
