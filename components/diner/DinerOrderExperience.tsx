"use client";

import Link from "next/link";
import {
  Edit2,
  ReceiptText,
  RefreshCcw,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerOrderExperienceProps = {
  table: ReturnType<typeof dinerTableSchema.parse>;
};

function statusLabel(status: string) {
  switch (status) {
    case "cart":
      return { label: "DRAFT", color: "bg-orange-100 text-[#c14418]" };
    case "pending":
      return { label: "PENDING", color: "bg-[#fbeadb] text-[#c14418]" };
    case "accepted":
      return { label: "ACCEPTED", color: "bg-blue-100/50 text-blue-600" };
    case "in_progress":
      return { label: "PREPARING", color: "bg-blue-100 text-blue-600" };
    case "ready":
      return { label: "READY", color: "bg-green-100/50 text-green-700" };
    case "delivered":
      return { label: "DELIVERED", color: "bg-green-100 text-green-700" };
    case "unavailable":
      return { label: "UNAVAILABLE", color: "bg-red-100 text-red-600" };
    case "cancelled":
      return { label: "CANCELLED", color: "bg-gray-100 text-gray-600" };
    default:
      return { label: status.toUpperCase(), color: "bg-gray-100 text-gray-600" };
  }
}

export function DinerOrderExperience({ table }: DinerOrderExperienceProps) {
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

  async function handleConfirmOrder() {
    setConfirming(true);
    setFeedback(null);

    try {
      await fetchJson("/api/diner/order/confirm", { method: "POST" });
      await orderQuery.refetch();
      setFeedback("Pedido confirmado y enviado a cocina.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Error al confirmar pedido.");
    } finally {
      setConfirming(false);
    }
  }

  const subtotalLive = liveItems.reduce(
    (accumulator, item) => accumulator + item.priceSnapshot * item.qty,
    0,
  );
  const subtotalCart = cartItems.reduce(
    (accumulator, item) => accumulator + item.priceSnapshot * item.qty,
    0,
  );
  const subtotal = subtotalLive + subtotalCart;
  const serviceCharge = subtotal * 0.10;
  const total = subtotal + serviceCharge;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background pb-28">
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-primary">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">The Bistro</h1>
        </div>
        <div className="rounded-full bg-secondary/60 px-4 py-1.5 text-sm font-semibold tracking-wide text-muted-foreground">
          Table {table.number}
        </div>
      </header>

      <section className="mt-4 px-6">
        <div className="mb-4 flex justify-between items-baseline">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Live Order
          </h2>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Confirmed Items
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {liveItems.length === 0 ? (
            <div className="py-2 text-[13px] italic text-muted-foreground">
              No tienes items confirmados aun.
            </div>
          ) : null}
          {liveItems.map((item) => {
            const status = statusLabel(item.status);

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-[1.25rem] border border-transparent bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/50 shadow-sm">
                  <span className="text-xl font-bold text-muted-foreground">
                    {item.qty}x
                  </span>
                </div>
                <div className="flex w-full flex-col justify-center gap-1.5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-base leading-tight font-bold text-foreground">
                      {item.qty} {item.nameSnapshot}
                    </h3>
                    <span className="font-semibold text-foreground">
                      ${(item.priceSnapshot * item.qty).toFixed(2)}
                    </span>
                  </div>
                  {item.notes ? (
                    <p className="text-xs leading-snug italic text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                  <div className="mt-1 flex items-center gap-1">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest ${status.color}`}
                    >
                      {item.status === "delivered" ? (
                        <span className="size-1.5 rounded-full bg-green-600" />
                      ) : null}
                      {item.status === "pending" ? (
                        <UtensilsCrossed className="size-2.5" />
                      ) : null}
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10 px-6">
        <div className="mb-4 flex justify-between items-baseline">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            In Your Cart
          </h2>
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#c14418] uppercase">
            Draft
          </span>
        </div>

        <div className="rounded-[1.5rem] bg-secondary/40 p-5">
          {cartItems.length === 0 ? (
            <div className="py-4 text-center text-[13px] italic text-muted-foreground">
              Tu carrito esta vacio.
              <Link className="ml-1 font-bold text-primary" href={`/t/${table.id}`}>
                Ver menu
              </Link>
            </div>
          ) : null}

          <div className="flex flex-col gap-6">
            {cartItems.map((item) => (
              <EditableCartItem
                item={item}
                key={item.id}
                onRefresh={() => orderQuery.refetch()}
              />
            ))}

            {cartItems.length > 0 ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3 opacity-80 pointer-events-none">
                <div className="flex -space-x-2">
                  <div className="size-6 rounded-full border border-white bg-slate-200" />
                  <div className="size-6 rounded-full border border-white bg-slate-300" />
                </div>
                <span className="mr-auto text-[11px] text-muted-foreground">
                  {!sessionData ? "Solo vos en esta sesion" : "Sesion compartida activa"}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-10 mb-8 px-6">
        <div className="mb-3 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
          <span>
            Subtotal ({liveItems.length} confirmed, {cartItems.length} cart)
          </span>
          <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
        </div>
        <div className="mb-6 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
          <span>Service Charge (10%)</span>
          <span className="font-bold text-foreground">${serviceCharge.toFixed(2)}</span>
        </div>
        <div className="flex items-end justify-between border-t border-border/60 pt-4">
          <span className="text-xl font-bold tracking-tight">Total</span>
          <span className="text-3xl font-black tracking-tighter text-[#c14418]">
            ${total.toFixed(2)}
          </span>
        </div>
        {feedback ? (
          <div className="mt-4 text-center text-[13px] font-bold text-primary">
            {feedback}
          </div>
        ) : null}
      </section>

      <div className="fixed right-4 bottom-4 left-4 z-50 flex items-center gap-4 rounded-[1.75rem] bg-card p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <Link className="flex-none" href={`/t/${table.id}/pay`}>
          <div className="flex h-14 w-28 items-center justify-center gap-2 rounded-2xl bg-secondary/60 font-bold text-foreground transition-colors hover:bg-secondary/90">
            <ReceiptText className="size-5" />
            <span>Bill</span>
          </div>
        </Link>

        {cartItems.length > 0 ? (
          <button
            className="flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-primary font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-[#a83b14] active:scale-[0.98]"
            disabled={confirming}
            onClick={() => void handleConfirmOrder()}
            type="button"
          >
            {confirming ? (
              <RefreshCcw className="size-5 animate-spin" />
            ) : (
              <ShoppingCart className="size-5" />
            )}
            <span>Confirm Order</span>
          </button>
        ) : (
          <Link
            className="flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-primary font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-[#a83b14] active:scale-[0.98]"
            href={`/t/${table.id}`}
          >
            Ver el Menu
          </Link>
        )}
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
    } catch {
      // The current UI has no inline delete feedback state yet.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative flex w-full items-start gap-4">
      {isSaving ? <div className="absolute inset-0 z-10 rounded-xl bg-white/50" /> : null}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card font-bold text-primary shadow-sm">
        {item.qty}x
      </div>
      <div className="flex min-h-[3.5rem] flex-1 flex-col justify-center pt-1">
        <h4 className="text-[14.5px] leading-tight font-bold text-foreground">
          {item.nameSnapshot}
        </h4>
        <span className="mt-1 text-[12.5px] leading-none font-medium text-muted-foreground">
          ${(item.priceSnapshot * item.qty).toFixed(2)}
        </span>
      </div>
      <div className="flex h-14 items-center gap-3">
        <button
          className="text-muted-foreground/60 transition-colors hover:text-foreground"
          type="button"
        >
          <Edit2 className="size-4" />
        </button>
        <button
          className="text-muted-foreground/60 transition-colors hover:text-destructive"
          onClick={() => void handleDelete()}
          type="button"
        >
          <Trash2 className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}
