import Link from "next/link";
import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
};

type AdminShellProps = {
  title: string;
  description?: string;
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
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 bg-background h-full min-h-[calc(100vh-theme(spacing.16))]">
      <header className="flex flex-col gap-4 pb-2 border-b border-border/70 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin Console</h1>
            <div className="h-4 w-px bg-border"></div>
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              {title}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar mesas, personal..." 
                className="w-64 pl-9 bg-secondary border-none rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/40 shadow-inner"
              />
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Bell className="size-[1.1rem] hover:text-foreground cursor-pointer transition-colors" />
              <div className="h-5 w-px bg-border/80"></div>
              <HelpCircle className="size-5 hover:text-foreground cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Título de sección secundaria u opcional */}
      {(description || navItems) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between px-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            {description && <p className="text-sm italic text-muted-foreground mt-1 max-w-2xl">{description}</p>}
          </div>

          {navItems && navItems.length > 0 && (
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary",
                    activeHref === item.href
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground bg-transparent"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      )}

      <div className="mt-2 flex-1">
        {children}
      </div>
    </div>
  );
}
