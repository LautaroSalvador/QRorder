import { DinerErrorState } from "@/components/diner/DinerErrorState";
import { DinerOrderExperience } from "@/components/diner/DinerOrderExperience";
import { getDinerEntryState } from "@/lib/diner";
import { dinerTableParamsSchema } from "@/lib/validations/diner";

type DinerOrderPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerOrderPage({ params }: DinerOrderPageProps) {
  const parsedParams = dinerTableParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return (
      <DinerErrorState message="La mesa no existe o el QR no es válido." />
    );
  }

  try {
    const entryState = await getDinerEntryState(parsedParams.data.tableId);

    if ("error" in entryState && entryState.error) {
      return <DinerErrorState message={entryState.error.message} />;
    }

    return (
      <main className="bg-muted/30">
        <DinerOrderExperience table={entryState.table} />
      </main>
    );
  } catch {
    return (
      <DinerErrorState message="No pudimos cargar el pedido de la mesa en este momento." />
    );
  }
}
