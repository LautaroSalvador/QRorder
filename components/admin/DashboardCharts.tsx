"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchJson } from "@/lib/fetcher";

type SalesRow = {
  date: string;
  orderCount: number;
  total: number;
};

type TopItem = {
  name: string;
  totalQty: number;
  totalRevenue: number;
};

const CURRENCY = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function shortDate(dateStr: string) {
  // "2026-04-20" → "20/04"
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

// Custom tooltip for sales chart
function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const total = payload.find((p) => p.name === "total")?.value ?? 0;
  const orders = payload.find((p) => p.name === "orderCount")?.value ?? 0;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-foreground">{label}</p>
      <p className="text-muted-foreground mt-1">
        Ventas: <span className="font-semibold text-foreground">{CURRENCY.format(total)}</span>
      </p>
      <p className="text-muted-foreground">
        Pedidos: <span className="font-semibold text-foreground">{orders}</span>
      </p>
    </div>
  );
}

export function DashboardCharts() {
  const salesQuery = useQuery({
    queryKey: ["dashboard-sales-7d"],
    queryFn: () =>
      fetchJson<{ rows: SalesRow[] }>("/api/staff/admin/reports/sales"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const topItemsQuery = useQuery({
    queryKey: ["dashboard-top-items-7d"],
    queryFn: () =>
      fetchJson<{ rows: TopItem[] }>("/api/staff/admin/reports/top-items"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const salesRows = salesQuery.data?.rows ?? [];
  const topItems = (topItemsQuery.data?.rows ?? []).slice(0, 5);

  // Normalise data for chart
  const chartData = salesRows.map((row) => ({
    ...row,
    label: shortDate(row.date),
  }));

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* Sales bar chart */}
      <div className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Ventas últimos 7 días
          </h3>
          <p className="text-xs text-muted-foreground">Solo pedidos pagados</p>
        </div>

        {salesQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : salesRows.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Sin ventas en el período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<SalesTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar
                dataKey="total"
                name="total"
                radius={[6, 6, 0, 0]}
                fill="hsl(var(--primary))"
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items chart */}
      <div className="rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Productos más pedidos (7 días)
          </h3>
          <p className="text-xs text-muted-foreground">Top 5 por cantidad</p>
        </div>

        {topItemsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : topItems.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Sin datos en el período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) =>
                  v.length > 14 ? v.slice(0, 13) + "…" : v
                }
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                formatter={(value: any) => [value, "Pedidos"]}
              />
              <Bar
                dataKey="totalQty"
                name="qty"
                radius={[0, 6, 6, 0]}
                fill="hsl(var(--primary) / 0.75)"
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
