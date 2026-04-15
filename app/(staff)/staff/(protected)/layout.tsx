import type { ReactNode } from "react";

import { StaffBottomNav } from "@/components/staff/StaffBottomNav";
import { StaffMobileHeader } from "@/components/staff/StaffMobileHeader";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { requireStaffSession } from "@/lib/auth/staff";

type ProtectedStaffLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedStaffLayout({
  children,
}: ProtectedStaffLayoutProps) {
  const session = await requireStaffSession();
  const { role } = session.profile;

  return (
    <div className="flex min-h-screen bg-background">
      <StaffSidebar role={role} />

      <div className="flex min-h-screen flex-1 flex-col">
        <StaffMobileHeader role={role} />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>

      <StaffBottomNav role={role} />
    </div>
  );
}
