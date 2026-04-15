"use client";

import { useEffect, useState } from "react";

import { useUpdateOrderItem } from "@/components/cashier/useCashierTables";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CashierOrderItem } from "@/lib/validations/cashier";

const NEEDS_REASON = ["accepted", "in_progress", "ready", "delivered"] as const;

type EditItemDialogProps = {
  tableId: string;
  item: CashierOrderItem | null;
  onClose: () => void;
};

export function EditItemDialog({ tableId, item, onClose }: EditItemDialogProps) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  const updateItem = useUpdateOrderItem(tableId);

  const needsReason = item
    ? (NEEDS_REASON as readonly string[]).includes(item.status)
    : false;

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setQty(item.qty);
      setNotes(item.notes ?? "");
      setReason("");
    }
  }, [item]);

  function handleClose() {
    setReason("");
    onClose();
  }

  async function handleSave() {
    if (!item) return;

    await updateItem.mutateAsync({
      itemId: item.id,
      qty,
      notes: notes.trim() || null,
      reason: reason.trim() || undefined,
    });

    handleClose();
  }

  async function handleCancel() {
    if (!item) return;

    await updateItem.mutateAsync({
      itemId: item.id,
      status: "cancelled",
      reason: reason.trim() || undefined,
    });

    handleClose();
  }

  return (
    <Dialog open={item !== null} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item?.name_snapshot ?? "Editar ítem"}
          </DialogTitle>
        </DialogHeader>

        {item ? (
          <div className="space-y-4">
            {/* Qty */}
            <div className="space-y-1">
              <Label htmlFor="edit-qty">Cantidad</Label>
              <Input
                id="edit-qty"
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="edit-notes">Aclaraciones</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="Sin sal, sin hielo…"
              />
            </div>

            {/* Reason — required if item was already accepted by kitchen/bar */}
            {needsReason ? (
              <div className="space-y-1">
                <Label htmlFor="edit-reason">
                  Motivo del cambio{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Este campo es obligatorio para ítems ya aceptados por cocina/barra."
                />
              </div>
            ) : null}

            {updateItem.error ? (
              <p className="text-sm text-destructive">
                {updateItem.error instanceof Error
                  ? updateItem.error.message
                  : "No pudimos guardar el cambio."}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            disabled={updateItem.isPending || (needsReason && !reason.trim())}
            onClick={() => void handleCancel()}
          >
            Cancelar ítem
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              disabled={updateItem.isPending || (needsReason && !reason.trim())}
              onClick={() => void handleSave()}
            >
              Guardar cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
