import { StaffSidebarNav } from "@/components/staff/StaffSidebarNav";
import { StaffSignOutButton } from "@/components/staff/StaffSignOutButton";
import type { StaffProfile } from "@/lib/auth/staff";
import { UserRound } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type StaffSidebarProps = {
  profile: StaffProfile;
};

export function StaffSidebar({ profile }: StaffSidebarProps) {
  return (
    <aside className="hidden md:block md:w-64 md:flex-none">
      <div className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card px-0 py-6">
        <div className="flex items-center justify-between px-6">
          <div className="space-y-1">
            <p className="text-xl font-semibold tracking-tight text-primary">
              MesaQR
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
              Admin Terminal
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-8 flex-1">
          <StaffSidebarNav role={profile.role} />
        </div>

        <div className="px-6 mt-auto">
          <StaffSignOutButton className="w-full flex items-center justify-start gap-3 h-14 rounded-xl px-3 hover:bg-secondary border-none shadow-none font-normal">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserRound className="size-5" />
            </div>
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="text-sm font-semibold text-foreground truncate w-full">
                {profile.full_name}
              </span>
              <span className="text-xs text-muted-foreground truncate w-full">
                {profile.role === "admin" ? "General Manager" : "Shift Supervisor"}
              </span>
            </div>
          </StaffSignOutButton>
        </div>
      </div>
    </aside>
  );
}
