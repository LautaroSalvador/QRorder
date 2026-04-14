"use client";

import Link from "next/link";

import { Minus, Plus, RefreshCcw, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import type { DinerMenuCategory } from "@/lib/validations/diner";
import { dinerTableSchema } from "@/lib/validations/diner";
import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";

type DinerMenuExperienceProps = {
  categories: DinerMenuCategory[];
  table: ReturnType<typeof dinerTableSchema.parse>;
};

export function DinerMenuExperience({
  categories,
  table,
}: DinerMenuExperienceProps) {
  const { data: sessionData, error: sessionError, isLoading: isSessionLoading } =
    useDinerSession(table.id);
  const orderQuery = useDinerOrder(Boolean(sessionData), table.id);
  const {
    closeItemDialog,
    isItemDialogOpen,
    items,
    openItemDialog,
    selectedItem,
    setOrderSnapshot,
  } = useDinerCartStore();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (orderQuery.data) {
      setOrderSnapshot(orderQuery.data);
    }
  }, [orderQuery.data, setOrderSnapshot]);

  useEffect(() => {
    if (selectedItem) {
      setQty(1);
      setNotes("");
      setSubmitError(null);
    }
  }, [selectedItem]);

  const cartCount = useMemo(
    () =>
      items
        .filter((item) => item.status === "cart")
        .reduce((accumulator, item) => accumulator + item.qty, 0),
    [items],
  );

  const subtotal = orderQuery.data?.subtotal ?? 0;

  async function handleAddItem() {
    if (!selectedItem) {
      return;
    }

    setIsAddingItem(true);
    setSubmitError(null);

    try {
      await fetchJson("/api/diner/order/items", {
        body: JSON.stringify({
          menuItemId: selectedItem.id,
          notes,
          qty,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      closeItemDialog();
      await orderQuery.refetch();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No pudimos agregar el ítem.",
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="sticky top-0 z-20 rounded-[1.75rem] border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              MesaQR
            </p>
            <h1 className="text-2xl font-semibold">
              {table.name} · Mesa {table.number}
            </h1>
            <p className="text-sm text-muted-foreground">
              Menú disponible para pedir desde el celular.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void orderQuery.refetch()}
              disabled={!sessionData || orderQuery.isFetching}
            >
              <RefreshCcw className="size-4" />
              Actualizar
            </Button>
            <Button asChild size="sm">
              <Link href={`/t/${table.id}/order`}>
                <ShoppingBag className="size-4" />
                Mi pedido ({cartCount})
              </Link>
            </Button>
          </div>
        </div>
        {isSessionLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Abriendo mesa...</p>
        ) : null}
        {sessionError ? (
          <p className="mt-3 text-sm text-destructive">{sessionError}</p>
        ) : null}
      </header>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No hay ítems disponibles en el menú por ahora.
          </CardContent>
        </Card>
      ) : null}

      {categories.map((category) => (
        <section key={category.id} className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{category.name}</h2>
            <p className="text-sm text-muted-foreground">
              Preparación: {category.preparationArea}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {category.items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="h-44 bg-muted-surface">
                  {item.imageUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sin foto
                    </div>
                  )}
                </div>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <span className="text-sm font-semibold">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => openItemDialog(item)}
                    disabled={!sessionData}
                  >
                    <Plus className="size-4" />
                    Agregar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 mt-auto">
        <Card className="border-primary/15 bg-card/95 shadow-lg">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal actual</p>
              <p className="text-2xl font-semibold">${subtotal.toFixed(2)}</p>
            </div>
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href={`/t/${table.id}/order`}>
                Ver pedido ({cartCount})
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isItemDialogOpen && selectedItem ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <Card className="w-full max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{selectedItem.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description}
                </p>
                <p className="text-sm font-medium">
                  ${selectedItem.price.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cantidad</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((current) => Math.max(1, current - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    value={qty}
                    onChange={(event) =>
                      setQty(Math.max(1, Number(event.target.value) || 1))
                    }
                    type="number"
                    min={1}
                    max={99}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((current) => Math.min(99, current + 1))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Aclaraciones</p>
                <Textarea
                  maxLength={200}
                  placeholder="Sin cebolla, bien cocido, etc."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeItemDialog()}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleAddItem()}
                  disabled={isAddingItem}
                >
                  Agregar al pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
