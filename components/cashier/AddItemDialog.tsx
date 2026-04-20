"use client";

import { useState } from "react";

import { useAddTableItem } from "@/components/cashier/useCashierTables";
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
import { fetchJson } from "@/lib/fetcher";
import { dinerMenuResponseSchema } from "@/lib/validations/diner";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// ─── Types from the diner menu endpoint (reused here) ────────────────────────

const menuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  description: z.string(),
  imageUrl: z.string().nullable(),
});

const menuCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  preparationArea: z.enum(["cocina", "barra"]),
  items: z.array(menuItemSchema),
});

type MenuItem = z.infer<typeof menuItemSchema>;

type AddItemDialogProps = {
  tableId: string;
  open: boolean;
  onClose: () => void;
};

export function AddItemDialog({ tableId, open, onClose }: AddItemDialogProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const addItem = useAddTableItem(tableId);

  // Load the menu
  const { data: menu } = useQuery({
    queryKey: ["diner-menu"],
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/diner/menu");
      return dinerMenuResponseSchema.parse(data).categories.map((category) =>
        menuCategorySchema.parse(category),
      );
    },
    staleTime: 60_000, // menu doesn't change often
  });

  const allItems = (menu ?? []).flatMap((cat) => cat.items);
  const filteredItems = search.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  function handleClose() {
    setSelectedItem(null);
    setQty(1);
    setNotes("");
    setSearch("");
    onClose();
  }

  async function handleSubmit() {
    if (!selectedItem) return;

    await addItem.mutateAsync({
      menuItemId: selectedItem.id,
      qty,
      notes: notes.trim() || undefined,
    });

    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar ítem a la mesa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-1">
            <Label>Buscar ítem</Label>
            <Input
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Item list */}
          <div className="max-h-52 overflow-y-auto divide-y divide-border rounded-lg border border-border">
            {filteredItems.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                {search ? "No se encontraron ítems." : "Cargando menú…"}
              </p>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${
                    selectedItem?.id === item.id ? "bg-muted" : ""
                  }`}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    ${item.price.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedItem ? (
            <>
              {/* Quantity */}
              <div className="space-y-1">
                <Label htmlFor="add-qty">Cantidad</Label>
                <Input
                  id="add-qty"
                  type="number"
                  min={1}
                  max={99}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="add-notes">Aclaraciones (opcional)</Label>
                <Textarea
                  id="add-notes"
                  placeholder="Sin sal, sin hielo…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!selectedItem || addItem.isPending}
            onClick={() => void handleSubmit()}
          >
            Agregar
          </Button>
        </DialogFooter>

        {addItem.error ? (
          <p className="text-sm text-destructive">
            {addItem.error instanceof Error
              ? addItem.error.message
              : "No pudimos agregar el ítem."}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
