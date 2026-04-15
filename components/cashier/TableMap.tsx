"use client";

import { TableChip } from "@/components/cashier/TableChip";
import type { CashierTable } from "@/lib/validations/cashier";

type TableMapProps = {
  tables: CashierTable[];
  onTableClick: (table: CashierTable) => void;
};

export function TableMap({ tables, onTableClick }: TableMapProps) {
  if (tables.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 text-center text-sm text-muted-foreground">
        No hay mesas configuradas. Creá mesas desde el panel de administración.
      </div>
    );
  }

  // Check if tables have custom positions set (pos_x/pos_y != 0)
  const hasCustomPositions = tables.some((t) => t.pos_x !== 0 || t.pos_y !== 0);

  if (hasCustomPositions) {
    // Positioned layout using absolute coordinates from DB
    const maxX = Math.max(...tables.map((t) => t.pos_x)) + 140;
    const maxY = Math.max(...tables.map((t) => t.pos_y)) + 140;

    return (
      <div
        className="relative w-full overflow-auto rounded-2xl border border-border bg-muted/20"
        style={{
          minHeight: Math.max(maxY, 300),
          minWidth: Math.max(maxX, 320),
        }}
      >
        {tables.map((table) => (
          <div
            key={table.id}
            className="absolute"
            style={{ left: table.pos_x, top: table.pos_y }}
          >
            <TableChip table={table} onClick={() => onTableClick(table)} />
          </div>
        ))}
      </div>
    );
  }

  // Fallback: responsive grid layout
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
      {tables.map((table) => (
        <TableChip key={table.id} table={table} onClick={() => onTableClick(table)} />
      ))}
    </div>
  );
}
