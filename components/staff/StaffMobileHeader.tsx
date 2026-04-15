import type { StaffRole } from "@/lib/staff";

import { StaffSignOutButton } from "@/components/staff/StaffSignOutButton";

type StaffMobileHeaderProps = {
  role: StaffRole;
};

export function StaffMobileHeader({ role }: StaffMobileHeaderProps) {
  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "cajero"
        ? "Caja"
        : role === "cocina"
          ? "Cocina"
          : "Barra";

  return (
    <div className="flex items-center justify-between border-b border-border/80 bg-card px-4 py-3 md:hidden">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          MesaQR
        </p>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>
      <StaffSignOutButton variant="ghost" />
    </div>
  );
}
