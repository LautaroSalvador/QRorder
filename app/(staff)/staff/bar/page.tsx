import { BarKanban } from "@/components/bar/BarKanban";
import { requireStaffSession } from "@/lib/auth/staff";

export default async function BarPage() {
  await requireStaffSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Barra</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Gestión de bebidas en preparación, listas para salir y entregas a mesa.
        </p>
      </div>
      <BarKanban />
    </main>
  );
}
