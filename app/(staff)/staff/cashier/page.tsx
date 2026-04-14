import { CashierSetupCard } from "@/components/cashier/CashierSetupCard";
import { requireStaffSession } from "@/lib/auth/staff";

export default async function CashierPage() {
  await requireStaffSession();

  return <CashierSetupCard />;
}
