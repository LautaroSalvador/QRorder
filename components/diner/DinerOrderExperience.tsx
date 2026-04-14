"use client";

import Link from "next/link";

import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      return "En carrito";
    case "pending":
      return "Pendiente";
    case "accepted":
      return "Aceptado";
    case "in_progress":
      return "En preparación";
    case "ready":
      return "Listo";
    case "delivered":
      return "Entregado";
    case "unavailable":
      return "No disponible";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
}

export function DinerOrderExperience({ table }: DinerOrderExperienceProps) {
  const { data: sessionData, error: sessionError, isLoading: isSessionLoading } =
    useDinerSession(table.id);
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

  async function handleConfirmOrder() {
    setConfirming(true);
    setFeedback(null);

    try {
      await fetchJson("/api/diner/order/confirm", {
        method: "POST",
      });
      await orderQuery.refetch();
      setFeedback("Pedido confirmado y enviado a cocina/barra.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No pudimos confirmar el pedido.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="rounded-[1.75rem] border border-border/80 bg-card/95 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              MesaQR
            </p>
            <h1 className="text-2xl font-semibold">Mi pedido</h1>
            <p className="text-sm text-muted-foreground">
              {table.name} · Mesa {table.number}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/t/${table.id}`}>Seguir pidiendo</Link>
            </Button>
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
          </div>
        </div>
        {isSessionLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Abriendo mesa...</p>
        ) : null}
        {sessionError ? (
          <p className="mt-3 text-sm text-destructive">{sessionError}</p>
        ) : null}
      </header>

      {orderQuery.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Cargando pedido...
          </CardContent>
        </Card>
      ) : null}

      {orderQuery.error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {orderQuery.error instanceof Error
              ? orderQuery.error.message
              : "No pudimos cargar el pedido."}
          </CardContent>
        </Card>
      ) : null}

      {!orderQuery.isLoading && !orderQuery.error && items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Todavía no agregaste ítems al pedido.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {items.map((item) =>
          item.status === "cart" ? (
            <EditableCartItem
              key={item.id}
              item={item}
              onRefresh={() => orderQuery.refetch()}
            />
          ) : (
            <Card key={item.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium">{item.nameSnapshot}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.qty} x ${item.priceSnapshot.toFixed(2)}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    {statusLabel(item.status)}
                  </span>
                </div>
                {item.notes ? (
                  <p className="text-sm text-muted-foreground">
                    Aclaraciones: {item.notes}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Para modificar, hablá con el cajero.
                </p>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Card className="mt-auto border-primary/15">
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">
              ${(orderQuery.data?.subtotal ?? 0).toFixed(2)}
            </span>
          </div>
          {feedback ? (
            <p className="text-sm text-primary">{feedback}</p>
          ) : null}
          {cartItems.length > 0 ? (
            <Button
              type="button"
              className="w-full"
              disabled={confirming}
              onClick={() => void handleConfirmOrder()}
            >
              Confirmar pedido
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay ítems en carrito para confirmar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type EditableCartItemProps = {
  item: ReturnType<typeof useDinerCartStore.getState>["items"][number];
  onRefresh: () => Promise<unknown>;
};

function EditableCartItem({ item, onRefresh }: EditableCartItemProps) {
  const [qty, setQty] = useState(item.qty);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setQty(item.qty);
    setNotes(item.notes ?? "");
  }, [item.id, item.notes, item.qty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await fetchJson(`/api/diner/order/items/${item.id}`, {
        body: JSON.stringify({
          notes,
          qty,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      await onRefresh();
      setFeedback("Ítem actualizado.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No pudimos actualizar el ítem.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsSaving(true);
    setFeedback(null);

    try {
      await fetchJson(`/api/diner/order/items/${item.id}`, {
        method: "DELETE",
      });
      await onRefresh();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "No pudimos quitar el ítem.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-medium">{item.nameSnapshot}</p>
              <p className="text-sm text-muted-foreground">
                ${item.priceSnapshot.toFixed(2)} c/u
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              En carrito
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                value={qty}
                onChange={(event) =>
                  setQty(Math.max(1, Number(event.target.value) || 1))
                }
                type="number"
                min={1}
                max={99}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Aclaraciones</label>
              <Textarea
                maxLength={200}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Sin cebolla, extra salsa, etc."
              />
            </div>
          </div>

          {feedback ? (
            <p
              className={`text-sm ${
                feedback.includes("actualizado")
                  ? "text-primary"
                  : "text-destructive"
              }`}
            >
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSaving}>
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSaving}
              onClick={() => void handleDelete()}
            >
              Quitar del carrito
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
