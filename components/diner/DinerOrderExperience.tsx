"use client";

import Link from "next/link";
import { ReceiptText, RefreshCcw, ShoppingCart, Trash2, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerOrderExperienceProps = {
  restaurantName: string;
  table: ReturnType<typeof dinerTableSchema.parse>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "cart":
      return { label: "En carrito", tone: "bg-orange-100 text-orange-700" };
    case "pending":
      return { label: "Pendiente", tone: "bg-amber-100 text-amber-700" };
    case "accepted":
      return { label: "Aceptado", tone: "bg-sky-100 text-sky-700" };
    case "in_progress":
      return { label: "En preparacion", tone: "bg-blue-100 text-blue-700" };
    case "ready":
      return { label: "Listo", tone: "bg-emerald-100 text-emerald-700" };
    case "delivered":
      return { label: "Entregado", tone: "bg-emerald-50 text-emerald-700" };
    case "unavailable":
      return { label: "No disponible", tone: "bg-rose-100 text-rose-700" };
    case "cancelled":
      return { label: "Cancelado", tone: "bg-stone-200 text-stone-700" };
    default:
      return { label: status, tone: "bg-stone-100 text-stone-700" };
  }
}

export function DinerOrderExperience({
  restaurantName,
  table,
}: DinerOrderExperienceProps) {
  const { data: sessionData } = useDinerSession(table.id);
  const orderQuery = useDinerOrder(Boolean(sessionData), table.id);
  const { items, setOrderSnapshot } = useDinerCartStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (orderQuery.data) {
      setOrderSnapshot(orderQuery.data);
    }
  }, [orderQuery.data, setOrderSnapshot]);

  const cartItems = useMemo(
    () => items.filter((item) => item.status === "cart"),
    [items],
  );

  const liveItems = useMemo(
    () => items.filter((item) => item.status !== "cart"),
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

  async function handleConfirmOrder() {
    setConfirming(true);
    setFeedback(null);

    try {
      await fetchJson("/api/diner/order/confirm", { method: "POST" });
      await orderQuery.refetch();
      setFeedback("Pedido confirmado y enviado a cocina/barra.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No pudimos confirmar el pedido.");
    } finally {
      setConfirming(false);
    }
  }

  const sessionStatus = orderQuery.data?.sessionStatus ?? "open";
  const billRequested =
    orderQuery.data?.table.status === "awaiting_payment" && sessionStatus === "open";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {restaurantName}
            </p>
            <h1 className="text-lg font-semibold text-foreground">Tu pedido</h1>
          </div>
          <div className="rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold text-muted-foreground">
            Mesa {table.number}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Se actualiza cada 5 segundos.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            type="button"
            onClick={() => void orderQuery.refetch()}
          >
            <RefreshCcw className="size-4" />
            Actualizar
          </button>
        </div>
      </header>

      <div className="space-y-8 px-6 py-6">
        {billRequested ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Caja ya recibio el aviso de cierre. Cuando confirmen la cuenta, vas a poder pagar desde esta misma mesa.
          </div>
        ) : null}

        {sessionStatus === "awaiting_payment" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            La cuenta ya esta lista para pagar.
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Items confirmados</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {liveItems.length}
            </span>
          </div>

          {liveItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Todavia no hay items confirmados para esta mesa.
            </div>
          ) : (
            <div className="space-y-4">
              {liveItems.map((item) => {
                const status = getStatusLabel(item.status);

                return (
                  <article
                    key={item.id}
                    className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          {item.qty} x {item.nameSnapshot}
                        </p>
                        {item.notes ? (
                          <p className="text-sm italic text-muted-foreground">{item.notes}</p>
                        ) : null}
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.priceSnapshot * item.qty)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">En carrito</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {cartItems.length}
            </span>
          </div>

          {cartItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No hay items pendientes de confirmar.
            </div>
          ) : (
            <div className="space-y-4 rounded-[1.5rem] bg-secondary/35 p-5">
              {cartItems.map((item) => (
                <EditableCartItem
                  key={item.id}
                  item={item}
                  onRefresh={() => orderQuery.refetch()}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal actual</span>
            <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-semibold text-foreground">Total estimado</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(subtotal)}</span>
          </div>
          {feedback ? (
            <p className="text-sm font-medium text-primary">{feedback}</p>
          ) : null}
        </section>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-20 grid gap-3 rounded-[1.75rem] bg-card p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        {sessionStatus === "awaiting_payment" ? (
          <Link
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white shadow-md shadow-primary/20"
            href={`/t/${table.id}/pay`}
          >
            <ReceiptText className="size-5" />
            Ir al pago
          </Link>
        ) : cartItems.length > 0 ? (
          <button
            className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary font-semibold text-white shadow-md shadow-primary/20 disabled:opacity-70"
            disabled={confirming}
            type="button"
            onClick={() => void handleConfirmOrder()}
          >
            {confirming ? <RefreshCcw className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
            Confirmar pedido
          </button>
        ) : null}

        <Link
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background font-medium text-foreground"
          href={`/t/${table.id}`}
        >
          <UtensilsCrossed className="size-4" />
          Seguir pidiendo
        </Link>
      </div>
    </div>
  );
}

type EditableCartItemProps = {
  item: ReturnType<typeof useDinerCartStore.getState>["items"][number];
  onRefresh: () => Promise<unknown>;
};

function EditableCartItem({ item, onRefresh }: EditableCartItemProps) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleDelete() {
    setIsSaving(true);

    try {
      await fetchJson(`/api/diner/order/items/${item.id}`, { method: "DELETE" });
      await onRefresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative flex items-start gap-4 rounded-2xl bg-card p-4 shadow-sm">
      {isSaving ? <div className="absolute inset-0 rounded-2xl bg-white/60" /> : null}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary font-semibold text-primary">
        {item.qty}x
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{item.nameSnapshot}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCurrency(item.priceSnapshot * item.qty)}
        </p>
      </div>
      <button
        className="text-muted-foreground transition-colors hover:text-destructive"
        type="button"
        onClick={() => void handleDelete()}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
