"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import type { DinerMenuCategory } from "@/lib/validations/diner";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerMenuExperienceProps = {
  categories: DinerMenuCategory[];
  table: ReturnType<typeof dinerTableSchema.parse>;
};

export function DinerMenuExperience({
  categories,
  table,
}: DinerMenuExperienceProps) {
  const { data: sessionData } = useDinerSession(table.id);
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

  const subtotalLive = items
    .filter((item) => item.status !== "cart")
    .reduce((accumulator, item) => accumulator + item.priceSnapshot * item.qty, 0);
  const subtotalCart = items
    .filter((item) => item.status === "cart")
    .reduce((accumulator, item) => accumulator + item.priceSnapshot * item.qty, 0);
  const subtotal = subtotalLive + subtotalCart;
  const isDialogActive = isItemDialogOpen && selectedItem !== null;

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
        error instanceof Error ? error.message : "No pudimos agregar el item.",
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background pb-28 selection:bg-primary/20">
      <div className="pointer-events-none absolute top-0 left-0 -z-10 h-[35vh] w-full bg-gradient-to-b from-[#fbeadb]/40 to-transparent" />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/80 px-6 pt-6 pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="font-bold text-primary">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
            {table.name}
          </h1>
        </div>
        <div className="shrink-0 rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold tracking-wide text-muted-foreground">
          Mesa {table.number}
        </div>
      </header>

      <section className="mt-6 mb-2 flex items-center justify-between px-6">
        <div>
          <h2 className="text-[28px] leading-tight font-extrabold tracking-tight text-foreground">
            Que van a pedir
            <br />
            hoy?
          </h2>
        </div>
      </section>

      <div className="mt-4 flex-1 space-y-10 px-4">
        {categories.length === 0 ? (
          <div className="py-20 text-center italic text-muted-foreground">
            Menu no disponible por el momento.
          </div>
        ) : null}

        {categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {category.name}
              </h3>
              <div className="ml-4 h-px flex-1 bg-border/60" />
            </div>

            <div className="grid grid-cols-1 gap-5">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-[1.75rem] border border-border/30 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-transform ${
                    sessionData
                      ? "cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                      : "opacity-75 grayscale-[0.2]"
                  }`}
                  onClick={() => sessionData && openItemDialog(item)}
                >
                  <div className="relative h-44 w-full shrink-0 bg-muted-surface">
                    {item.imageUrl ? (
                      <div
                        className="h-full w-full bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground/30">
                        <UtensilsCrossed className="size-10" />
                      </div>
                    )}
                    <div className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-foreground shadow-sm backdrop-blur-md">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between p-5">
                    <div className="space-y-2">
                      <h4 className="pr-4 text-[17px] leading-tight font-bold text-foreground">
                        {item.name}
                      </h4>
                      <p className="line-clamp-2 text-[13.5px] leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold tracking-widest text-primary uppercase">
                        <Plus className="size-3" /> Agregar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed right-4 bottom-4 left-4 z-10 flex items-center gap-4 rounded-[1.75rem] bg-card p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom-12 duration-500">
        <div className="flex flex-1 flex-col justify-center px-3">
          <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            Subtotal
          </span>
          <span className="text-xl font-black tracking-tight text-foreground">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        <Link className="flex-1" href={`/t/${table.id}/order`}>
          <div className="relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-[#a83b14] active:scale-[0.98]">
            <ShoppingBag className="size-5" />
            <span>Ver pedido</span>
            {cartCount > 0 ? (
              <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-black text-background shadow-sm ring-2 ring-card animate-in zoom-in">
                {cartCount}
              </div>
            ) : null}
          </div>
        </Link>
      </div>

      {isDialogActive && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={closeItemDialog}
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2.5rem] bg-card shadow-2xl animate-in slide-in-from-bottom-1/2 zoom-in-95 duration-300 sm:rounded-[2.5rem]">
            <div className="relative h-56 w-full bg-secondary/30">
              {selectedItem.imageUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedItem.imageUrl})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                  <UtensilsCrossed className="size-12" />
                </div>
              )}
              <button
                className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                onClick={closeItemDialog}
                type="button"
              >
                <Minus className="size-5 rotate-45" />
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-2">
                <h2 className="text-[22px] leading-tight font-black text-foreground">
                  {selectedItem.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[22px] font-bold text-primary">
                    ${selectedItem.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                {selectedItem.description}
              </p>

              <hr className="border-border/50" />

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold tracking-widest text-foreground uppercase">
                    Aclaraciones
                  </label>
                  <textarea
                    className="min-h-[5rem] w-full resize-none rounded-xl border-transparent bg-secondary/40 p-4 text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={200}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Sin cebolla, aderezo extra, etc."
                    value={notes}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold tracking-widest text-foreground uppercase">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-4 rounded-full bg-secondary/40 p-1.5 px-2 shadow-inner">
                    <button
                      className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-50"
                      disabled={qty <= 1}
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      type="button"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center text-[17px] font-bold">{qty}</span>
                    <button
                      className="flex size-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-colors hover:bg-secondary"
                      onClick={() => setQty(Math.min(99, qty + 1))}
                      type="button"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {submitError ? (
                <p className="mt-2 text-center text-sm font-bold text-destructive">
                  {submitError}
                </p>
              ) : null}

              <button
                className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-primary text-[16px] font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#a83b14] active:scale-[0.98]"
                disabled={isAddingItem}
                onClick={() => void handleAddItem()}
                type="button"
              >
                {isAddingItem ? "Agregando..." : `Agregar $${(selectedItem.price * qty).toFixed(2)}`}
                {!isAddingItem ? <Sparkles className="ml-1 size-4 opacity-70" /> : null}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
