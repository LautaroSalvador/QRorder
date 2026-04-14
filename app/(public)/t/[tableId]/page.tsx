import { DinerErrorState } from "@/components/diner/DinerErrorState";
import { DinerMenuExperience } from "@/components/diner/DinerMenuExperience";
import { getDinerEntryState, getPublishedMenu } from "@/lib/diner";
import { dinerTableParamsSchema } from "@/lib/validations/diner";

type DinerMenuPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerMenuPage({ params }: DinerMenuPageProps) {
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

    const categories = await getPublishedMenu();

    return (
      <main className="bg-muted/30">
        <DinerMenuExperience categories={categories} table={entryState.table} />
      </main>
    );
  } catch {
    return (
      <DinerErrorState message="No pudimos cargar el menú de la mesa en este momento." />
    );
  }
}
