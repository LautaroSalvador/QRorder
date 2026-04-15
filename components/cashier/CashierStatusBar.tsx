"use client";

import { RefreshCcw } from "lucide-react";

import { useCashierTables } from "@/components/cashier/useCashierTables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CashierStatusBar() {
  const { data: tables, isFetching, refetch } = useCashierTables();

  const all = tables ?? [];
  const available = all.filter((t) => t.status === "available").length;
  const occupied = all.filter((t) => t.status === "occupied").length;
  const active = all.filter(
    (t) => t.status === "occupied" && t.active_item_count > 0,
  ).length;
  const awaitingPayment = all.filter((t) => t.status === "awaiting_payment").length;

  return (
    <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          {available} disponible{available !== 1 ? "s" : ""}
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
        {active > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-blue-500/50 text-blue-700 dark:text-blue-400"
          >
            <span className="size-2 rounded-full bg-blue-500" />
            {active} con pedido
          </Badge>
        ) : null}
        {awaitingPayment > 0 ? (
          <Badge
            variant="outline"
            className="gap-1.5 border-purple-500/50 text-purple-700 dark:text-purple-400"
          >
            <span className="size-2 rounded-full bg-purple-500" />
            {awaitingPayment} esperando pago
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground hidden sm:block">
          Actualización cada 5 s
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={cn("size-4", isFetching ? "animate-spin" : undefined)}
          />
          ↻ Actualizar
        </Button>
      </div>
    </div>
  );
}
