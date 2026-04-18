"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChefHat,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetcher";

type DashboardKpiItem = {
  name: string;
  qty: number;
};

type DashboardKpisResponse = {
  ventasHoy: number;
  mesasActivas: number;
  ticketPromedio: number;
  topItems: DashboardKpiItem[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function KpiCard(props: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  const { icon: Icon, label, value } = props;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <p className="pt-3 text-xs uppercase text-muted-foreground">{label}</p>
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
      </CardHeader>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader className="pb-3">
        <div className="size-11 rounded-full bg-primary/10" />
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-9 w-36 rounded bg-muted" />
      </CardHeader>
    </Card>
  );
}

export function DashboardKPIs() {
  const query = useQuery({
    queryKey: ["admin-dashboard-kpis"],
    queryFn: () =>
      fetchJson<DashboardKpisResponse>("/api/staff/admin/dashboard"),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (query.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
    );
  }

  if (query.error || !query.data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive shadow-sm">
        <p className="font-medium">No pudimos cargar los indicadores.</p>
        <Button
          className="mt-4"
          onClick={() => void query.refetch()}
          type="button"
          variant="outline"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={DollarSign}
        label="Ventas del dia"
        value={formatCurrency(query.data.ventasHoy)}
      />
      <KpiCard
        icon={UtensilsCrossed}
        label="Mesas activas ahora"
        value={query.data.mesasActivas}
      />
      <KpiCard
        icon={TrendingUp}
        label="Ticket promedio"
        value={formatCurrency(query.data.ticketPromedio)}
      />
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ChefHat className="size-5" />
          </div>
          <p className="pt-3 text-xs uppercase text-muted-foreground">
            Items mas pedidos
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.data.topItems.length > 0 ? (
            query.data.topItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-foreground">
                  {item.name}
                </span>
                <span className="shrink-0 font-medium text-primary">
                  x{item.qty}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground">
              Todavia no hay items pedidos hoy.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
