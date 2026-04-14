import { DinerSetupCard } from "@/components/diner/DinerSetupCard";

type DinerDonePageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerDonePage({ params }: DinerDonePageProps) {
  const { tableId } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <DinerSetupCard
        tableId={tableId}
        title="Comprobante"
        description="La pantalla final ya tiene su ruta reservada para mostrar el resultado del pago y cerrar la sesión de mesa."
      />
    </main>
  );
}
