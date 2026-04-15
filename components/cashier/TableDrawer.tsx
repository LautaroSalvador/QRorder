"use client";

import { useEffect, useState } from "react";
import {
  PencilLine,
  Plus,
  Receipt,
  RotateCcw,
  WalletCards,
  X,
} from "lucide-react";

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
import type {
  CashierOrder,
  CashierOrderItem,
  CashierTable,
  CashierTableDetail,
} from "@/lib/validations/cashier";

type TableDrawerProps = {
  onClose: () => void;
  table: CashierTable;
};

type PanelHeaderProps = {
  capacity: number;
  elapsedTimeLabel: string;
  onClose: () => void;
  statusClassName: string;
  statusLabel: string;
  tableName: string;
  useSheetPrimitives: boolean;
};

type PanelBodyProps = {
  actionError: Error | null;
  canClose: boolean;
  canMarkPaid: boolean;
  canReset: boolean;
  closeTable: ReturnType<typeof useCloseTable>;
  detailCapacity: number;
  isLoading: boolean;
  markPaidOffline: ReturnType<typeof useMarkPaidOffline>;
  onClose: () => void;
  onEditItem: (item: CashierOrderItem) => void;
  onShowAddItem: () => void;
  order: CashierOrder | null;
  resetTable: ReturnType<typeof useResetTable>;
  session: CashierTableDetail["session"];
  table: CashierTable;
  useSheetPrimitives: boolean;
  visibleItems: CashierOrderItem[];
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const ITEM_STATUS_LABELS: Record<CashierOrderItem["status"], string> = {
  cart: "En carrito",
  pending: "Pendiente",
  accepted: "Aceptado",
  in_progress: "En preparacion",
  ready: "Listo",
  delivered: "Entregado",
  unavailable: "No disponible",
  cancelled: "Cancelado",
};

const ITEM_STATUS_STYLES: Record<CashierOrderItem["status"], string> = {
  cart: "bg-stone-100 text-stone-600",
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-sky-100 text-sky-700",
  in_progress: "bg-blue-100 text-blue-700",
  ready: "bg-emerald-100 text-emerald-700",
  delivered: "bg-stone-200 text-stone-600",
  unavailable: "bg-rose-100 text-rose-700",
  cancelled: "bg-rose-100 text-rose-700",
};

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function formatElapsedTime(openedAt: string | null) {
  if (!openedAt) {
    return "Sin sesion activa";
  }

  const openedDate = new Date(openedAt);
  const diffMs = Date.now() - openedDate.getTime();

  if (Number.isNaN(diffMs) || diffMs < 60_000) {
    return "Abierta hace menos de 1 min";
  }

  const totalMinutes = Math.floor(diffMs / 60_000);

  if (totalMinutes < 60) {
    return `Abierta hace ${totalMinutes} min`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (totalHours < 24) {
    return `Abierta hace ${totalHours} h ${remainingMinutes} min`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  return `Abierta hace ${totalDays} d ${remainingHours} h`;
}

function getTableBadgeStyles(table: CashierTable | null, sessionStatus: string | null) {
  if (sessionStatus === "awaiting_payment" || table?.status === "awaiting_payment") {
    return {
      className: "bg-purple-100 text-purple-700",
      label: "Cuenta pedida",
    };
  }

  if (sessionStatus === "paid" || table?.status === "closed") {
    return {
      className: "bg-rose-100 text-rose-700",
      label: "Pagada",
    };
  }

  if (table?.status === "available" || sessionStatus === null) {
    return {
      className: "bg-emerald-100 text-emerald-700",
      label: "Libre",
    };
  }

  if ((table?.active_item_count ?? 0) > 0) {
    return {
      className: "bg-blue-100 text-blue-700",
      label: "En curso",
    };
  }

  return {
    className: "bg-amber-100 text-amber-700",
    label: "Ocupada",
  };
}

function PanelHeader({
  capacity,
  elapsedTimeLabel,
  onClose,
  statusClassName,
  statusLabel,
  tableName,
  useSheetPrimitives,
}: PanelHeaderProps) {
  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
            statusClassName,
          )}
        >
          {statusLabel}
        </div>
        {useSheetPrimitives ? (
          <SheetTitle className="mt-2 text-4xl font-black tracking-tight text-stone-900">
            {tableName}
          </SheetTitle>
        ) : (
          <h2 className="mt-2 text-4xl font-black tracking-tight text-stone-900">
            {tableName}
          </h2>
        )}
        <p className="text-sm text-muted-foreground">
          {elapsedTimeLabel} · Capacidad para {capacity}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 rounded-full px-3 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        onClick={onClose}
      >
        <X className="mr-1 h-4 w-4" />
        Cerrar
      </Button>
    </div>
  );

  if (useSheetPrimitives) {
    return (
      <SheetHeader className="border-b border-stone-100 px-8 pb-6 pt-8">
        {content}
      </SheetHeader>
    );
  }

  return (
    <div className="border-b border-stone-100 px-8 pb-6 pt-8">
      {content}
    </div>
  );
}

function PanelBody({
  actionError,
  canClose,
  canMarkPaid,
  canReset,
  closeTable,
  detailCapacity,
  isLoading,
  markPaidOffline,
  onClose,
  onEditItem,
  onShowAddItem,
  order,
  resetTable,
  session,
  table,
  useSheetPrimitives,
  visibleItems,
}: PanelBodyProps) {
  const badgeStyles = getTableBadgeStyles(table, session?.status ?? null);

  return (
    <div className="flex h-full flex-col bg-white">
      <PanelHeader
        capacity={detailCapacity}
        elapsedTimeLabel={formatElapsedTime(session?.opened_at ?? null)}
        onClose={onClose}
        statusClassName={badgeStyles.className}
        statusLabel={badgeStyles.label}
        tableName={table.name}
        useSheetPrimitives={useSheetPrimitives}
      />

      <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
            Cargando detalle de la mesa...
          </div>
        ) : !session ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 text-center">
            <p className="text-lg font-semibold text-stone-800">
              Mesa disponible
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              No hay una sesion activa en este momento para esta mesa.
            </p>
          </div>
        ) : (
          <>
            <div>
              {visibleItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center">
                  <p className="text-base font-semibold text-stone-800">
                    Todavia no hay items confirmados
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cuando entren pedidos a la mesa, los vas a ver aca.
                  </p>
                </div>
              ) : (
                <div>
                  {visibleItems.map((item) => (
                    <div key={item.id} className="border-b border-stone-50 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 shrink-0 pt-0.5 text-xl font-black text-stone-900">
                          {item.qty}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-stone-900">
                                {item.name_snapshot}
                              </p>
                              {item.notes ? (
                                <p className="mt-1 text-sm italic text-muted-foreground">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                className={cn(
                                  "rounded-full border-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                                  ITEM_STATUS_STYLES[item.status],
                                )}
                                variant="outline"
                              >
                                {ITEM_STATUS_LABELS[item.status]}
                              </Badge>
                              <p className="min-w-[80px] text-right text-base font-medium text-stone-700">
                                {formatCurrency(item.price_snapshot * item.qty)}
                              </p>
                            </div>
                          </div>

                          {canClose ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="mt-3 h-auto px-0 py-0 text-sm font-semibold text-stone-600 hover:bg-transparent hover:text-stone-900"
                              onClick={() => onEditItem(item)}
                            >
                              <PencilLine className="mr-2 h-4 w-4" />
                              Editar item
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {order && visibleItems.length > 0 ? (
              <div className="mt-6 border-t-2 border-stone-100 pt-6">
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-stone-800">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                {order.tip > 0 ? (
                  <div className="mt-2 flex items-center justify-between text-base">
                    <span className="text-muted-foreground">Propina</span>
                    <span className="font-medium text-stone-800">
                      {formatCurrency(order.tip)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-black text-stone-900">Total</span>
                  <span className="text-2xl font-black text-primary">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            ) : null}

            {actionError ? (
              <p className="mt-4 text-sm text-destructive">
                {actionError instanceof Error
                  ? actionError.message
                  : "Ocurrio un error."}
              </p>
            ) : null}

            <div className="mt-8 space-y-3">
              {canClose ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-stone-300 py-6 text-base font-bold text-stone-700"
                    onClick={onShowAddItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar item
                  </Button>
                  <Button
                    type="button"
                    className="w-full rounded-xl bg-gradient-to-br from-orange-700 to-orange-500 py-6 text-base font-bold text-white shadow-lg shadow-orange-100 transition-all hover:shadow-orange-200"
                    disabled={closeTable.isPending || visibleItems.length === 0}
                    onClick={() => void closeTable.mutateAsync()}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Cerrar mesa
                  </Button>
                </>
              ) : null}

              {canMarkPaid ? (
                <Button
                  type="button"
                  className="w-full rounded-xl bg-stone-800 py-6 text-base font-bold text-white hover:bg-stone-900"
                  disabled={markPaidOffline.isPending}
                  onClick={() => void markPaidOffline.mutateAsync()}
                >
                  <WalletCards className="mr-2 h-4 w-4" />
                  Marcar pagado en efectivo
                </Button>
              ) : null}

              {canReset ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl py-5 text-base font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                  disabled={resetTable.isPending}
                  onClick={() => void resetTable.mutateAsync()}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetear mesa
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TableDrawer({ onClose, table }: TableDrawerProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<CashierOrderItem | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const { data: detail, isLoading } = useCashierTableDetail(table.id);

  const closeTable = useCloseTable(table.id);
  const markPaidOffline = useMarkPaidOffline(table.id);
  const resetTable = useResetTable(table.id);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  const session = detail?.session ?? null;
  const order = detail?.order ?? null;
  const visibleItems = (order?.items ?? []).filter((item) => item.status !== "cancelled");

  const canClose = session?.status === "open";
  const canMarkPaid = session?.status === "awaiting_payment";
  const canReset = session?.status === "paid" || session?.status === "cancelled";

  const actionError = closeTable.error ?? markPaidOffline.error ?? resetTable.error;
  const tableData = {
    ...table,
    name: detail?.name ?? table.name,
  };
  const detailCapacity = detail?.capacity ?? table.capacity;

  return (
    <>
      {isDesktop ? (
        <aside className="fixed inset-y-0 right-0 hidden w-[440px] border-l border-stone-200 bg-white lg:block">
          <div className="h-screen overflow-y-auto">
            <PanelBody
              actionError={actionError}
              canClose={canClose}
              canMarkPaid={canMarkPaid}
              canReset={canReset}
              closeTable={closeTable}
              detailCapacity={detailCapacity}
              isLoading={isLoading}
              markPaidOffline={markPaidOffline}
              onClose={onClose}
              onEditItem={(item) => setEditingItem(item)}
              onShowAddItem={() => setShowAddItem(true)}
              order={order}
              resetTable={resetTable}
              session={session}
              table={tableData}
              useSheetPrimitives={false}
              visibleItems={visibleItems}
            />
          </div>
        </aside>
      ) : (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
          <SheetContent
            showCloseButton={false}
            className="w-full overflow-y-auto border-l border-stone-200 bg-white p-0 sm:max-w-[440px]"
          >
            <PanelBody
              actionError={actionError}
              canClose={canClose}
              canMarkPaid={canMarkPaid}
              canReset={canReset}
              closeTable={closeTable}
              detailCapacity={detailCapacity}
              isLoading={isLoading}
              markPaidOffline={markPaidOffline}
              onClose={onClose}
              onEditItem={(item) => setEditingItem(item)}
              onShowAddItem={() => setShowAddItem(true)}
              order={order}
              resetTable={resetTable}
              session={session}
              table={tableData}
              useSheetPrimitives
              visibleItems={visibleItems}
            />
          </SheetContent>
        </Sheet>
      )}

      <AddItemDialog
        tableId={table.id}
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
      />

      <EditItemDialog
        tableId={table.id}
        item={editingItem}
        onClose={() => setEditingItem(null)}
      />
    </>
  );
}
