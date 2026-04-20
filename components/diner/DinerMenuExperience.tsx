"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import type { DinerMenuCategory } from "@/lib/validations/diner";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerMenuExperienceProps = {
  categories: DinerMenuCategory[];
  restaurantName: string;
  table: ReturnType<typeof dinerTableSchema.parse>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

export function DinerMenuExperience({
  categories,
  restaurantName,
  table,
}: DinerMenuExperienceProps) {
  const { data: sessionData, error: sessionError } = useDinerSession(table.id);
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
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);

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

  const subtotal = useMemo(
    () =>
      items.reduce((accumulator, item) => {
        if (item.status === "cancelled" || item.status === "unavailable") {
          return accumulator;
        }

        return accumulator + item.priceSnapshot * item.qty;
      }, 0),
    [items],
  );

  const isDialogActive = isItemDialogOpen && selectedItem !== null;

  const selectedItemCategory = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return categories.find((category) =>
      category.items.some((item) => item.id === selectedItem.id),
    );
  }, [categories, selectedItem]);

  const isDrink = useMemo(() => {
    if (!selectedItemCategory) {
      return false;
    }

    const normalizedName = selectedItemCategory.name.toLowerCase();
    return (
      normalizedName.includes("bebida") ||
      normalizedName.includes("trago") ||
      normalizedName.includes("cafeteria") ||
      normalizedName.includes("vino") ||
      normalizedName.includes("cerveza")
    );
  }, [selectedItemCategory]);

  async function performAddItem(menuItemId: string, finalQty: number, finalNotes: string) {
    await fetchJson("/api/diner/order/items", {
      body: JSON.stringify({
        menuItemId,
        notes: finalNotes,
        qty: finalQty,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    await orderQuery.refetch();
  }

  async function handleAddItem() {
    if (!selectedItem) {
      return;
    }

    setIsAddingItem(true);
    setSubmitError(null);

    try {
      await performAddItem(selectedItem.id, qty, notes);
      closeItemDialog();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No pudimos agregar el item.",
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleQuickAdd(
    event: React.MouseEvent,
    item: DinerMenuCategory["items"][number],
  ) {
    event.stopPropagation();

    if (!sessionData) {
      return;
    }

    setQuickAddError(null);
    setQuickAddingId(item.id);

    try {
      await performAddItem(item.id, 1, "");
    } catch (error) {
      setQuickAddError(
        error instanceof Error ? error.message : "No pudimos sumar el item.",
      );
    } finally {
      setQuickAddingId(null);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(251,234,219,0.55),transparent)]" />

      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {restaurantName}
            </p>
            <h1 className="truncate text-lg font-semibold text-foreground">
              Menú digital
            </h1>
          </div>
          <div className="rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold text-muted-foreground">
            Mesa {table.number}
          </div>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="whitespace-nowrap rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {category.name}
            </a>
          ))}
        </div>
      </header>

      <section className="px-6 pt-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Pedi tranquilo desde tu mesa
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sumá productos al pedido compartido y seguí el estado desde el celular.
        </p>

        {sessionError ? (
          <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {sessionError}
          </p>
        ) : null}

        {quickAddError ? (
          <p className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {quickAddError}
          </p>
        ) : null}
      </section>

      <div className="flex-1 space-y-10 px-4 pt-6">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            El menu no esta disponible en este momento.
          </div>
        ) : null}

        {categories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="space-y-4 pt-12"
          >
            <div className="flex items-center gap-3 px-2">
              <h3 className="text-xl font-semibold text-foreground">{category.name}</h3>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid gap-5">
              {category.items.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
                >
                  <button
                    className="block w-full text-left"
                    type="button"
                    onClick={() => sessionData && openItemDialog(item)}
                  >
                    <div className="relative h-44 w-full bg-muted">
                      {item.imageUrl ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/40">
                          <UtensilsCrossed className="size-10" />
                        </div>
                      )}
                      <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-foreground shadow-sm">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </button>

                  <div className="space-y-4 p-5">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold leading-tight text-foreground">
                        {item.name}
                      </h4>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={quickAddingId === item.id || !sessionData}
                      type="button"
                      onClick={(event) => void handleQuickAdd(event, item)}
                    >
                      <Plus className="size-4" />
                      {quickAddingId === item.id ? "Sumando..." : "Agregar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center gap-4 rounded-[1.75rem] bg-card p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex-1 px-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Subtotal
          </span>
          <div className="text-xl font-black tracking-tight text-foreground">
            {formatCurrency(subtotal)}
          </div>
        </div>

        <Link
          className="relative flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white shadow-md shadow-primary/20"
          href={`/t/${table.id}/order`}
        >
          <ShoppingBag className="size-5" />
          Ver pedido
          {cartCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-black text-background ring-2 ring-card">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </div>

      {isDialogActive && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            type="button"
            onClick={closeItemDialog}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2.5rem] bg-card shadow-2xl sm:rounded-[2.5rem]">
            <div className="relative h-48 w-full bg-secondary/30 sm:h-56">
              {selectedItem.imageUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedItem.imageUrl})` }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/30">
                  <UtensilsCrossed className="size-12" />
                </div>
              )}

              <button
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
                type="button"
                onClick={closeItemDialog}
              >
                <Minus className="size-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-black leading-tight text-foreground">
                  {selectedItem.name}
                </h2>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(selectedItem.price)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectedItem.description}
                </p>
              </div>

              {!isDrink ? (
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-foreground">
                    Aclaraciones
                  </label>
                  <textarea
                    className="min-h-[5rem] w-full resize-none rounded-xl border border-border bg-secondary/40 p-4 text-sm outline-none focus:border-primary/30"
                    maxLength={200}
                    placeholder="Sin cebolla, aderezo aparte, etc."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                  Cantidad
                </label>
                <div className="flex items-center gap-4 rounded-full bg-secondary/40 px-2 py-1.5 shadow-inner">
                  <button
                    className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-50"
                    disabled={qty <= 1}
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-6 text-center text-lg font-bold">{qty}</span>
                  <button
                    className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-secondary"
                    type="button"
                    onClick={() => setQty(Math.min(99, qty + 1))}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              {submitError ? (
                <p className="text-center text-sm font-medium text-destructive">
                  {submitError}
                </p>
              ) : null}

              <button
                className="w-full rounded-[1.25rem] bg-primary px-4 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#a83b14] disabled:opacity-70"
                disabled={isAddingItem}
                type="button"
                onClick={() => void handleAddItem()}
              >
                {isAddingItem
                  ? "Agregando..."
                  : `Agregar ${formatCurrency(selectedItem.price * qty)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
