import { DinerSetupCard } from "@/components/diner/DinerSetupCard";

type DinerMenuPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerMenuPage({ params }: DinerMenuPageProps) {
  const { tableId } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <DinerSetupCard
        tableId={tableId}
        title="Menú de mesa"
        description="La ruta pública del QR ya existe. En Fase 2 se conecta con la apertura automática de sesión, el menú y el carrito colaborativo."
      />
    </main>
  );
}
