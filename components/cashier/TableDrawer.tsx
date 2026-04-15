"use client";

import { useState } from "react";

import { AddItemDialog } from "@/components/cashier/AddItemDialog";
import { EditItemDialog } from "@/components/cashier/EditItemDialog";
import {
  useCashierTableDetail,
  useCloseTable,
  useMarkPaidOffline,
  useResetTable,
} from "@/components/cashier/useCashierTables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CashierOrderItem, CashierTable } from "@/lib/validations/cashier";

type TableDrawerProps = {
  table: CashierTable | null;
  onClose: () => void;
};

const ITEM_STATUS_LABELS: Record<CashierOrderItem["status"], string> = {
  cart: "En carrito",
  pending: "Pendiente",
  accepted: "Aceptado",
  in_progress: "En preparación",
  ready: "Listo",
  delivered: "Entregado",
  unavailable: "No disponible",
  cancelled: "Cancelado",
};

const ITEM_STATUS_VARIANT: Record<
  CashierOrderItem["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  cart: "outline",
  pending: "secondary",
  accepted: "secondary",
  in_progress: "default",
  ready: "default",
  delivered: "outline",
  unavailable: "destructive",
  cancelled: "destructive",
};

export function TableDrawer({ table, onClose }: TableDrawerProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<CashierOrderItem | null>(null);

  const { data: detail, isLoading } = useCashierTableDetail(table?.id ?? null);

  const closeTable = useCloseTable(table?.id ?? "");
  const markPaidOffline = useMarkPaidOffline(table?.id ?? "");
  const resetTable = useResetTable(table?.id ?? "");

  const session = detail?.session ?? null;
  const order = detail?.order ?? null;
  const items = order?.items ?? [];
  const visibleItems = items.filter((i) => i.status !== "cancelled");

  const canClose = session?.status === "open";
  const canMarkPaid = session?.status === "awaiting_payment";
  const canReset = session?.status === "paid" || session?.status === "cancelled";

  const actionError =
    closeTable.error ?? markPaidOffline.error ?? resetTable.error;

  return (
    <>
      <Sheet open={table !== null} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="flex items-center justify-between gap-3">
              <span>
                Mesa {detail?.number ?? table?.number} — {detail?.name ?? table?.name}
              </span>
              {session ? (
                <Badge variant="outline" className="shrink-0">
                  {session.status === "open"
                    ? "Abierta"
                    : session.status === "awaiting_payment"
                    ? "Esperando pago"
                    : session.status === "paid"
                    ? "Pagada"
                    : "Cancelada"}
                </Badge>
              ) : null}
            </SheetTitle>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : !session ? (
              <div className="flex flex-col items-center justify-center min-h-40 gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Esta mesa está disponible. No hay sesión activa.
                </p>
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay ítems confirmados todavía.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        ×{item.qty} {item.name_snapshot}
                      </p>
                      {item.notes ? (
                        <p className="text-xs text-muted-foreground italic">
                          {item.notes}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        ${(item.price_snapshot * item.qty).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={ITEM_STATUS_VARIANT[item.status]}
                        className="text-[10px]"
                      >
                        {ITEM_STATUS_LABELS[item.status]}
                      </Badge>
                      {canClose ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2"
                          onClick={() => setEditingItem(item)}
                        >
                          Editar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtotal */}
            {order && visibleItems.length > 0 ? (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tip > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Propina</span>
                    <span>${order.tip.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-base font-bold mt-1">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            ) : null}

            {actionError ? (
              <p className="text-sm text-destructive">
                {actionError instanceof Error
                  ? actionError.message
                  : "Ocurrió un error."}
              </p>
            ) : null}
          </div>

          {/* Footer actions */}
          <div className={cn("px-6 py-4 border-t border-border space-y-2")}>
            {canClose ? (
              <>
                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowAddItem(true)}
                >
                  + Agregar ítem
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  disabled={closeTable.isPending || visibleItems.length === 0}
                  onClick={() => void closeTable.mutateAsync()}
                >
                  Cerrar mesa
                </Button>
              </>
            ) : null}

            {canMarkPaid ? (
              <Button
                type="button"
                className="w-full"
                variant="outline"
                disabled={markPaidOffline.isPending}
                onClick={() => void markPaidOffline.mutateAsync()}
              >
                Marcar pagado en efectivo
              </Button>
            ) : null}

            {canReset ? (
              <Button
                type="button"
                className="w-full"
                variant="secondary"
                disabled={resetTable.isPending}
                onClick={() => void resetTable.mutateAsync()}
              >
                Resetear mesa
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sub-dialogs */}
      {table ? (
        <AddItemDialog
          tableId={table.id}
          open={showAddItem}
          onClose={() => setShowAddItem(false)}
        />
      ) : null}

      {table ? (
        <EditItemDialog
          tableId={table.id}
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      ) : null}
    </>
  );
}
