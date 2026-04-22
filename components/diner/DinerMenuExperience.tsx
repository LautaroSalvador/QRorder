"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Search, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import type { DinerMenuCategory } from "@/lib/validations/diner";
import { dinerTableSchema } from "@/lib/validations/diner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

/** Devuelve etiquetas dietéticas hardcodeadas por coincidencia de nombre */
function getDietaryTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const tags: string[] = [];
  if (
    text.includes("vegano") ||
    text.includes("vegan") ||
    text.includes("plant based") ||
    text.includes("base vegetal")
  ) {
    tags.push("Vegano");
  }
  if (
    text.includes("sin tacc") ||
    text.includes("sin gluten") ||
    text.includes("gluten free") ||
    text.includes("sin trigo")
  ) {
    tags.push("Sin TACC");
  }
  if (text.includes("recomendado") || text.includes("chef") || text.includes("favorito")) {
    tags.push("⭐ Recomendado");
  }
  return tags;
}

const TAG_STYLES: Record<string, string> = {
  "Vegano": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Sin TACC": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "⭐ Recomendado": "bg-primary/10 text-primary",
};

export function DinerMenuExperience({
  categories,
  restaurantName,
  table,
}: DinerMenuExperienceProps) {
  const router = useRouter();
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  // Inactivity kick-out
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      if (isIdle) return;
      clearTimeout(timeout);
      // 15 minutos de inactividad
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, 15 * 60 * 1000); 
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((evt) => document.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((evt) => document.removeEventListener(evt, resetTimer));
    };
  }, [isIdle]);

  // Auto-redirect to pay when session transitions to awaiting_payment
  useEffect(() => {
    if (orderQuery.data?.sessionStatus === "awaiting_payment") {
      router.push(`/t/${table.id}/pay`);
    }
  }, [orderQuery.data?.sessionStatus, router, table.id]);

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
        .reduce((acc, item) => acc + item.qty, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (item.status === "cancelled" || item.status === "unavailable") return acc;
        return acc + item.priceSnapshot * item.qty;
      }, 0),
    [items],
  );

  // Filter categories/items by search query
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return activeCategory
        ? categories.filter((c) => c.id === activeCategory)
        : categories;
    }
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search, categories, activeCategory]);

  const isDialogActive = isItemDialogOpen && selectedItem !== null;

  const selectedItemCategory = useMemo(() => {
    if (!selectedItem) return null;
    return categories.find((category) =>
      category.items.some((item) => item.id === selectedItem.id),
    );
  }, [categories, selectedItem]);

  const isDrink = useMemo(() => {
    if (!selectedItemCategory) return false;
    const name = selectedItemCategory.name.toLowerCase();
    return (
      name.includes("bebida") ||
      name.includes("trago") ||
      name.includes("cafeteria") ||
      name.includes("vino") ||
      name.includes("cerveza")
    );
  }, [selectedItemCategory]);

  async function performAddItem(menuItemId: string, finalQty: number, finalNotes: string) {
    await fetchJson("/api/diner/order/items", {
      body: JSON.stringify({ menuItemId, notes: finalNotes, qty: finalQty }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    await orderQuery.refetch();
  }

  async function handleAddItem() {
    if (!selectedItem) return;
    setIsAddingItem(true);
    setSubmitError(null);
    try {
      await performAddItem(selectedItem.id, qty, notes);
      closeItemDialog();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No pudimos agregar el ítem.");
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleQuickAdd(event: React.MouseEvent, item: DinerMenuCategory["items"][number]) {
    event.stopPropagation();
    if (!sessionData) return;
    setQuickAddError(null);
    setQuickAddingId(item.id);
    try {
      await performAddItem(item.id, 1, "");
    } catch (error) {
      setQuickAddError(error instanceof Error ? error.message : "No pudimos sumar el ítem.");
    } finally {
      setQuickAddingId(null);
    }
  }

  if (isIdle) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 text-center">
        <UtensilsCrossed className="mb-4 size-16 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sesión en pausa</h1>
        <p className="mt-2 text-muted-foreground">
          Por inactividad, hemos ocultado el menú. Si seguís en la mesa, volvé a escanear el QR para continuar tu pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(251,234,219,0.45),transparent)] dark:bg-[linear-gradient(180deg,rgba(120,60,20,0.12),transparent)]" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {restaurantName}
            </p>
            <h1 className="truncate text-lg font-semibold text-foreground">
              Menú digital
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="rounded-full bg-secondary/60 px-3 py-1.5 text-sm font-semibold text-muted-foreground">
              Mesa {table.number}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-full border border-border/60 bg-secondary/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Buscar en el menú..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setActiveCategory(null); }}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
              onClick={() => setSearch("")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        {!search && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-primary text-white"
                  : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-white"
                    : "border border-border/60 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Intro + errors */}
      {!search && !activeCategory && (
        <section className="px-5 pt-5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Pedí tranquilo desde tu mesa
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Sumá productos al pedido compartido y seguí el estado desde el celular.
          </p>
        </section>
      )}

      {sessionError && (
        <p className="mx-5 mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {sessionError}
        </p>
      )}
      {quickAddError && (
        <p className="mx-5 mt-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {quickAddError}
        </p>
      )}

      {/* Menu */}
      <div className="flex-1 space-y-8 px-4 pt-4">
        {filteredCategories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            {search ? `Sin resultados para "${search}"` : "El menú no está disponible en este momento."}
          </div>
        )}

        {filteredCategories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-44">
            <div className="flex items-center gap-3 px-1">
              <h3 className="text-xl font-semibold text-foreground">{category.name}</h3>
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">{category.items.length} ítems</span>
            </div>

            <div className="grid gap-4">
              {category.items.map((item) => {
                const tags = getDietaryTags(item.name, item.description);
                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-card shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  >
                    <button
                      className="block w-full text-left"
                      type="button"
                      onClick={() => sessionData && openItemDialog(item)}
                    >
                      <div className="relative h-44 w-full bg-muted">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 448px) 100vw, 448px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground/30">
                            <UtensilsCrossed className="size-10" />
                          </div>
                        )}
                        <span className="absolute bottom-3 right-3 rounded-full bg-white/95 dark:bg-card/95 px-3 py-1.5 text-sm font-bold text-foreground shadow-sm">
                          {formatCurrency(item.price)}
                        </span>
                        {/* Dietary tags on image */}
                        {tags.length > 0 && (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TAG_STYLES[tag] ?? "bg-card text-foreground"}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex items-end justify-between gap-4 p-4">
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-base font-semibold leading-tight text-foreground">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={quickAddingId === item.id || !sessionData}
                        type="button"
                        onClick={(event) => void handleQuickAdd(event, item)}
                      >
                        <Plus className="size-4" />
                        {quickAddingId === item.id ? "..." : "Agregar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-4 left-4 right-4 z-20 flex items-center gap-4 rounded-[1.75rem] bg-card p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
        <div className="flex-1 px-2">
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
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-black text-background ring-2 ring-card">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Item dialog */}
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
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  sizes="448px"
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
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black leading-tight text-foreground">
                  {selectedItem.name}
                </h2>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(selectedItem.price)}
                </p>
                {selectedItem.description && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {selectedItem.description}
                  </p>
                )}
                {/* Tags in modal */}
                {getDietaryTags(selectedItem.name, selectedItem.description).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {getDietaryTags(selectedItem.name, selectedItem.description).map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TAG_STYLES[tag] ?? "bg-card text-foreground"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!isDrink && (
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-foreground">
                    Aclaraciones
                  </label>
                  <textarea
                    className="min-h-[4.5rem] w-full resize-none rounded-xl border border-border bg-secondary/40 p-4 text-sm outline-none focus:border-primary/30"
                    maxLength={200}
                    placeholder="Sin cebolla, aderezo aparte, etc."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                  Cantidad
                </label>
                <div className="flex items-center gap-4 rounded-full bg-secondary/40 px-2 py-1.5">
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

              {submitError && (
                <p className="text-center text-sm font-medium text-destructive">{submitError}</p>
              )}

              <button
                className="w-full rounded-[1.25rem] bg-primary px-4 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 disabled:opacity-70"
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
