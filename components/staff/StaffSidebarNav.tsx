"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { StaffRole } from "@/lib/staff";
import { getStaffNavItems, isStaffPathActive } from "@/lib/staff-navigation";
import { cn } from "@/lib/utils";

type StaffSidebarNavProps = {
  role: StaffRole;
};

export function StaffSidebarNav({ role }: StaffSidebarNavProps) {
  const pathname = usePathname();
  const items = getStaffNavItems(role);

  return (
    <nav className="space-y-1">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = isStaffPathActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
              isActive &&
                "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
