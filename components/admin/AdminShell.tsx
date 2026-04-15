import Link from "next/link";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
};

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  navItems?: AdminNavItem[];
  activeHref?: string;
};

export function AdminShell({
  title,
  description,
  children,
  navItems,
  activeHref,
}: AdminShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            MesaQR · Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {navItems ? (
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  activeHref === item.href &&
                    "border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      {children}
    </div>
  );
}
