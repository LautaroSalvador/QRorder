import { DinerErrorState } from "@/components/diner/DinerErrorState";
import { DinerMenuExperience } from "@/components/diner/DinerMenuExperience";
import { getDinerEntryState, getPublishedMenu } from "@/lib/diner";
import { getRestaurantConfigSnapshot } from "@/lib/restaurant-config";
import { dinerTableParamsSchema } from "@/lib/validations/diner";
import { redirect } from "next/navigation";

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

    if (entryState.table.status === "awaiting_payment") {
      redirect(`/t/${entryState.table.id}/pay`);
    }

    const [categories, restaurantConfig] = await Promise.all([
      getPublishedMenu(),
      getRestaurantConfigSnapshot(),
    ]);

    return (
      <main className="bg-muted/30">
        <DinerMenuExperience
          categories={categories}
          restaurantName={restaurantConfig.name}
          table={entryState.table}
        />
      </main>
    );
  } catch {
    return (
      <DinerErrorState message="No pudimos cargar el menú de la mesa en este momento." />
    );
  }
}
