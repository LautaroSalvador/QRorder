import type { StaffRole } from "@/lib/staff";

import { StaffSignOutButton } from "@/components/staff/StaffSignOutButton";
import { StaffSidebarNav } from "@/components/staff/StaffSidebarNav";

type StaffSidebarProps = {
  role: StaffRole;
};

export function StaffSidebar({ role }: StaffSidebarProps) {
  return (
    <aside className="hidden md:block md:w-60 md:flex-none">
      <div className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-border/80 bg-card px-4 py-6">
        <div className="space-y-1 px-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Staff
          </p>
          <p className="text-2xl font-semibold tracking-tight">MesaQR</p>
        </div>

        <div className="mt-8 flex-1">
          <StaffSidebarNav role={role} />
        </div>

        <StaffSignOutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
