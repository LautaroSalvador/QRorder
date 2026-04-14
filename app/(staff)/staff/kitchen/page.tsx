import { KitchenQueuePlaceholder } from "@/components/kitchen/KitchenQueuePlaceholder";
import { requireStaffSession } from "@/lib/auth/staff";

export default async function KitchenPage() {
  await requireStaffSession();

  return (
    <KitchenQueuePlaceholder
      area="cocina"
      title="Cola de cocina"
      description="La ruta protegida ya existe y queda lista para recibir la cola de ítems con polling de 5 segundos."
    />
  );
}
