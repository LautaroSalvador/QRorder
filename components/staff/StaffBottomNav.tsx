"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { StaffRole } from "@/lib/staff";
import {
  getStaffBottomNavItems,
  isStaffPathActive,
} from "@/lib/staff-navigation";
import { cn } from "@/lib/utils";

type StaffBottomNavProps = {
  role: StaffRole;
};

export function StaffBottomNav({ role }: StaffBottomNavProps) {
  const pathname = usePathname();
  const items = getStaffBottomNavItems(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/80 bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {items.map(({ href, icon: Icon, mobileLabel }) => {
        const isActive = isStaffPathActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 pt-3 text-[11px] font-medium text-muted-foreground transition-colors",
              isActive && "text-primary",
            )}
          >
            <Icon
              className={cn("size-5", isActive ? "text-primary" : undefined)}
            />
            <span className="truncate">{mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
