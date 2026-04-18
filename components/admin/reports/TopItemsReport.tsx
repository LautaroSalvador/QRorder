"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchJson } from "@/lib/fetcher";

import { DateRangePicker, getPresetRange } from "./DateRangePicker";

type TopItemsRow = {
  name: string;
  totalQty: number;
  totalRevenue: number;
};

type TopItemsReportResponse = {
  rows: TopItemsRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="space-y-3 animate-pulse">
        <div className="h-10 rounded-xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function TopItemsReport() {
  const defaultRange = getPresetRange(7);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const query = useQuery({
    queryKey: ["admin-reports-top-items", from, to],
    queryFn: () =>
      fetchJson<TopItemsReportResponse>(
        `/api/staff/admin/reports/top-items?from=${from}&to=${to}`,
      ),
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-4">
      <DateRangePicker
        from={from}
        to={to}
        onChange={(nextFrom, nextTo) => {
          setFrom(nextFrom);
          setTo(nextTo);
        }}
      />

      {query.isLoading ? <TableSkeleton /> : null}

      {!query.isLoading && query.data?.rows.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Sin ventas en este periodo.
        </div>
      ) : null}

      {!query.isLoading && query.data && query.data.rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Unidades</th>
                <th className="px-4 py-3 font-medium">Total recaudado</th>
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((row, index) => (
                <tr key={row.name} className="border-t border-border/50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.totalQty}</td>
                  <td className="px-4 py-3">{formatCurrency(row.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
