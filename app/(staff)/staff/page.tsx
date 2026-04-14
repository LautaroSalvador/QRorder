import { redirect } from "next/navigation";

import { getStaffSession } from "@/lib/auth/staff";

export default async function StaffIndexPage() {
  const session = await getStaffSession();

  redirect(session ? "/staff/cashier" : "/staff/login");
}
