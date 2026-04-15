import { DinerErrorState } from "@/components/diner/DinerErrorState";
import { DinerPaymentExperience } from "@/components/diner/DinerPaymentExperience";
import { dinerTableParamsSchema } from "@/lib/validations/diner";

type DinerPayPageProps = {
  params: Promise<{
    tableId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function DinerPayPage({
  params,
  searchParams,
}: DinerPayPageProps) {
  const parsedParams = dinerTableParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return <DinerErrorState message="La mesa no existe o el QR no es válido." />;
  }

  const resolvedSearchParams = await searchParams;

  return (
    <main className="bg-muted/30">
      <DinerPaymentExperience
        returnStatus={resolvedSearchParams.status ?? null}
        tableId={parsedParams.data.tableId}
      />
    </main>
  );
}
