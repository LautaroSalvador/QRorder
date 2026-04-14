import { DinerSetupCard } from "@/components/diner/DinerSetupCard";

type DinerOrderPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerOrderPage({ params }: DinerOrderPageProps) {
  const { tableId } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <DinerSetupCard
        tableId={tableId}
        title="Mi pedido"
        description="Esta pantalla queda lista para mostrar el pedido compartido de la mesa con polling cada 5 segundos y botón visible de actualización."
      />
    </main>
  );
}
