"use client";

import { cn } from "@/lib/utils";
import type { CashierTable } from "@/lib/validations/cashier";

type TableChipProps = {
  table: CashierTable;
  onClick: () => void;
};

type TableVisualStatus =
  | "available"
  | "active"      // occupied with pending+ items
  | "occupied"    // occupied, no confirmed items yet
  | "awaiting"    // awaiting_payment
  | "closed";

function getVisualStatus(table: CashierTable): TableVisualStatus {
  if (table.status === "available") return "available";
  if (table.status === "awaiting_payment") return "awaiting";
  if (table.status === "closed") return "closed";
  // occupied: differentiate by whether there are confirmed items
  if (table.active_item_count > 0) return "active";
  return "occupied";
}

const STATUS_STYLES: Record<TableVisualStatus, { bg: string; border: string; text: string; label: string }> = {
  available: {
    bg: "bg-emerald-500/15 hover:bg-emerald-500/25",
    border: "border-emerald-500/50",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Disponible",
  },
  occupied: {
    bg: "bg-amber-500/15 hover:bg-amber-500/25",
    border: "border-amber-500/50",
    text: "text-amber-700 dark:text-amber-400",
    label: "Ocupada",
  },
  active: {
    bg: "bg-blue-500/15 hover:bg-blue-500/25",
    border: "border-blue-500/50",
    text: "text-blue-700 dark:text-blue-400",
    label: "Pedido en curso",
  },
  awaiting: {
    bg: "bg-purple-500/15 hover:bg-purple-500/25",
    border: "border-purple-500/50",
    text: "text-purple-700 dark:text-purple-400",
    label: "Esperando pago",
  },
  closed: {
    bg: "bg-rose-500/15 hover:bg-rose-500/25",
    border: "border-rose-500/50",
    text: "text-rose-700 dark:text-rose-400",
    label: "Cerrada",
  },
};

export function TableChip({ table, onClick }: TableChipProps) {
  const visual = getVisualStatus(table);
  const style = STATUS_STYLES[visual];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition-all duration-150 cursor-pointer select-none",
        "w-24 h-24",
        style.bg,
        style.border,
      )}
      title={`${table.name} — ${style.label}`}
    >
      <span className={cn("text-2xl font-bold leading-none", style.text)}>
        {table.number}
      </span>
      <span className="text-[10px] font-medium text-muted-foreground leading-none text-center">
        {table.name}
      </span>
      {table.active_item_count > 0 ? (
        <span className={cn("text-[10px] font-semibold", style.text)}>
          {table.active_item_count} ítem{table.active_item_count !== 1 ? "s" : ""}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground">{style.label}</span>
      )}
    </button>
  );
}
