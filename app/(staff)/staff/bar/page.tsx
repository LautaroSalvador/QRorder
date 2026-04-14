import { KitchenQueuePlaceholder } from "@/components/kitchen/KitchenQueuePlaceholder";
import { requireStaffSession } from "@/lib/auth/staff";

export default async function BarPage() {
  await requireStaffSession();

  return (
    <KitchenQueuePlaceholder
      area="barra"
      title="Cola de barra"
      description="La vista del área de barra queda preparada para su tablero y futura subvista de runner."
    />
  );
}
