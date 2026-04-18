"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchJson } from "@/lib/fetcher";

import { DateRangePicker, getPresetRange } from "./DateRangePicker";

type SalesRow = {
  date: string;
  total: number;
  orderCount: number;
};

type SalesReportResponse = {
  rows: SalesRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR").format(
    new Date(Date.UTC(year, month - 1, day, 12, 0, 0)),
  );
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

export function SalesReport() {
  const defaultRange = getPresetRange(7);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const query = useQuery({
    queryKey: ["admin-reports-sales", from, to],
    queryFn: () =>
      fetchJson<SalesReportResponse>(
        `/api/staff/admin/reports/sales?from=${from}&to=${to}`,
      ),
    refetchOnWindowFocus: true,
  });

  const totalOrders =
    query.data?.rows.reduce((accumulator, row) => accumulator + row.orderCount, 0) ??
    0;
  const totalPeriod =
    query.data?.rows.reduce((accumulator, row) => accumulator + row.total, 0) ?? 0;

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
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Ordenes</th>
                <th className="px-4 py-3 font-medium">Total del dia</th>
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((row) => (
                <tr key={row.date} className="border-t border-border/50">
                  <td className="px-4 py-3">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">{row.orderCount}</td>
                  <td className="px-4 py-3">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border/60 bg-muted/20 font-medium">
              <tr>
                <td className="px-4 py-3">Total del periodo</td>
                <td className="px-4 py-3">{totalOrders}</td>
                <td className="px-4 py-3">{formatCurrency(totalPeriod)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  );
}
