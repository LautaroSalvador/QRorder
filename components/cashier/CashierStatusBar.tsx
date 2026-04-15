"use client";

import { useCashierTables } from "@/components/cashier/useCashierTables";
import { Badge } from "@/components/ui/badge";

export function CashierStatusBar() {
  const { data: tables } = useCashierTables();

  const all = tables ?? [];
  const available = all.filter((table) => table.status === "available").length;
  const occupied = all.filter(
    (table) => table.status === "occupied" && table.active_item_count === 0,
  ).length;
  const inProgress = all.filter(
    (table) => table.status === "occupied" && table.active_item_count > 0,
  ).length;
  const awaitingPayment = all.filter(
    (table) => table.status === "awaiting_payment",
  ).length;
  const closed = all.filter((table) => table.status === "closed").length;

  return (
    <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          {available} libre{available !== 1 ? "s" : ""}
        </Badge>

        {occupied > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-500/50 text-amber-700 dark:text-amber-400"
          >
            <span className="size-2 rounded-full bg-amber-500" />
            {occupied} ocupada{occupied !== 1 ? "s" : ""}
          </Badge>
        ) : null}

        {inProgress > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-blue-500/50 text-blue-700 dark:text-blue-400"
          >
            <span className="size-2 rounded-full bg-blue-500" />
            {inProgress} en curso
          </Badge>
        ) : null}

        {awaitingPayment > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-purple-500/50 text-purple-700 dark:text-purple-400"
          >
            <span className="size-2 rounded-full bg-purple-500" />
            {awaitingPayment} cuenta
          </Badge>
        ) : null}

        {closed > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-rose-500/50 text-rose-700 dark:text-rose-400"
          >
            <span className="size-2 rounded-full bg-rose-500" />
            {closed} cerrada{closed !== 1 ? "s" : ""}
          </Badge>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground sm:text-right">
        Actualización automática cada 5 s
      </p>
    </div>
  );
}
