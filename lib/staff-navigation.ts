import type { ComponentType } from "react";

import {
  BarChart2,
  ChefHat,
  GlassWater,
  Grid3x3,
  LayoutDashboard,
  MonitorCheck,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import type { StaffRole } from "@/lib/staff";

export type StaffNavItem = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  mobileLabel: string;
  roles: StaffRole[];
};

const STAFF_NAV_ITEMS: StaffNavItem[] = [
  {
    href: "/staff/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    mobileLabel: "Inicio",
    roles: ["admin"],
  },
  {
    href: "/staff/cashier",
    icon: MonitorCheck,
    label: "Salón",
    mobileLabel: "Salón",
    roles: ["admin", "cajero"],
  },
  {
    href: "/staff/admin/menu",
    icon: UtensilsCrossed,
    label: "Menú",
    mobileLabel: "Menú",
    roles: ["admin"],
  },
  {
    href: "/staff/admin/tables",
    icon: Grid3x3,
    label: "Mesas",
    mobileLabel: "Mesas",
    roles: ["admin"],
  },
  {
    href: "/staff/admin/users",
    icon: Users,
    label: "Usuarios",
    mobileLabel: "Usuarios",
    roles: ["admin"],
  },
  {
    href: "/staff/admin/config",
    icon: Settings,
    label: "Configuración",
    mobileLabel: "Config",
    roles: ["admin"],
  },
  {
    href: "/staff/admin/reports",
    icon: BarChart2,
    label: "Reportes",
    mobileLabel: "Reportes",
    roles: ["admin"],
  },
  {
    href: "/staff/kitchen",
    icon: ChefHat,
    label: "Cola de cocina",
    mobileLabel: "Cocina",
    roles: ["admin", "cocina"],
  },
  {
    href: "/staff/bar",
    icon: GlassWater,
    label: "Cola de barra",
    mobileLabel: "Barra",
    roles: ["admin", "barra"],
  },
];

export function getStaffNavItems(role: StaffRole) {
  return STAFF_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getStaffBottomNavItems(role: StaffRole) {
  return getStaffNavItems(role).slice(0, 5);
}

export function isStaffPathActive(pathname: string, href: string) {
  if (href === "/staff/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
