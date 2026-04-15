"use client";

import { useMemo, useState } from "react";

import { TableDrawer } from "@/components/cashier/TableDrawer";
import { TableMap } from "@/components/cashier/TableMap";
import { useCashierTables } from "@/components/cashier/useCashierTables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CashierViewProps = {
  canEditLayout: boolean;
};

export function CashierView({ canEditLayout }: CashierViewProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const { data: tables, error, isLoading, refetch } = useCashierTables();

  const selectedTable = useMemo(
    () => tables?.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Cargando mesas...
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
            {error instanceof Error ? error.message : "Ocurrio un error inesperado."}
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
      <div className={cn("space-y-6", selectedTable ? "lg:pr-[472px]" : undefined)}>
        <TableMap
          canEditLayout={canEditLayout}
          onTableClick={(table) => setSelectedTableId(table.id)}
          selectedTableId={selectedTableId}
          tables={tables ?? []}
        />
      </div>

      {selectedTable ? (
        <TableDrawer table={selectedTable} onClose={() => setSelectedTableId(null)} />
      ) : null}
    </>
  );
}
