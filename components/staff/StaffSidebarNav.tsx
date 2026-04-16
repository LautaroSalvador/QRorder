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
              "flex items-center gap-4 px-6 py-3 text-[14.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground",
              isActive &&
                "text-primary hover:text-primary relative font-semibold bg-primary/5",
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
            {isActive && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-md" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
