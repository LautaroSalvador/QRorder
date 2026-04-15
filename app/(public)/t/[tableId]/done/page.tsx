import { DinerPaymentDone } from "@/components/diner/DinerPaymentDone";
import { DinerErrorState } from "@/components/diner/DinerErrorState";
import { dinerTableParamsSchema } from "@/lib/validations/diner";

type DinerDonePageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function DinerDonePage({ params }: DinerDonePageProps) {
  const parsedParams = dinerTableParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return <DinerErrorState message="La mesa no existe o el QR no es válido." />;
  }

  return <DinerPaymentDone tableId={parsedParams.data.tableId} />;
}
