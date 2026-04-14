import { DinerSetupCard } from "@/components/diner/DinerSetupCard";

type DinerPayPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerPayPage({ params }: DinerPayPageProps) {
  const { tableId } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
      <DinerSetupCard
        tableId={tableId}
        title="Pago de la cuenta"
        description="La estructura ya contempla propina configurable y Checkout Pro. El flujo real se implementa en la Fase 5."
      />
    </main>
  );
}
