"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { fetchJson } from "@/lib/fetcher";

import { DateRangePicker, getPresetRange } from "./DateRangePicker";

type PrepTimeRow = {
  categoryName: string;
  avgSeconds: number;
  itemCount: number;
};

type PrepTimeReportResponse = {
  rows: PrepTimeRow[];
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
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

export function PrepTimeReport() {
  const defaultRange = getPresetRange(7);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const query = useQuery({
    queryKey: ["admin-reports-prep-time", from, to],
    queryFn: () =>
      fetchJson<PrepTimeReportResponse>(
        `/api/staff/admin/reports/prep-time?from=${from}&to=${to}`,
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
          Sin datos de preparacion en este periodo.
        </div>
      ) : null}

      {!query.isLoading && query.data && query.data.rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Items preparados</th>
                <th className="px-4 py-3 font-medium">Tiempo promedio</th>
              </tr>
            </thead>
            <tbody>
              {query.data.rows.map((row) => (
                <tr key={row.categoryName} className="border-t border-border/50">
                  <td className="px-4 py-3">{row.categoryName}</td>
                  <td className="px-4 py-3">{row.itemCount}</td>
                  <td className="px-4 py-3">{formatDuration(row.avgSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
