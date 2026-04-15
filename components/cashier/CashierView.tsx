"use client";

import { useState } from "react";

import { CashierStatusBar } from "@/components/cashier/CashierStatusBar";
import { TableDrawer } from "@/components/cashier/TableDrawer";
import { TableMap } from "@/components/cashier/TableMap";
import { useCashierTables, type CashierTable } from "@/components/cashier/useCashierTables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CashierView() {
  const [selectedTable, setSelectedTable] = useState<CashierTable | null>(null);
  const { data: tables, isLoading, error, refetch } = useCashierTables();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Cargando mesas…
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No pudimos cargar las mesas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Ocurrió un error inesperado."}
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <CashierStatusBar />

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-emerald-500/40 border border-emerald-500/60" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-amber-500/40 border border-amber-500/60" />
            Ocupada (sin pedido confirmado)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-blue-500/40 border border-blue-500/60" />
            Pedido en curso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-purple-500/40 border border-purple-500/60" />
            Esperando pago
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-rose-500/40 border border-rose-500/60" />
            Cerrada
          </span>
        </div>

        <TableMap
          tables={tables ?? []}
          onTableClick={(table) => setSelectedTable(table)}
        />
      </div>

      <TableDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
      />
    </>
  );
}
