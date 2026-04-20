"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { useDinerSession } from "@/components/diner/useDinerSession";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetcher";
import {
  dinerPaymentCheckoutResponseSchema,
  dinerPaymentStatusResponseSchema,
  type DinerOrderResponse,
} from "@/lib/validations/diner";
import { useDinerOrder } from "@/components/diner/useDinerOrder";

type DinerPaymentExperienceProps = {
  restaurantName: string;
  returnStatus?: string | null;
  tableId: string;
  tipOptions: number[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function getVisibleItems(order: DinerOrderResponse | undefined) {
  return (
    order?.items.filter(
      (item) =>
        item.status !== "cart" &&
        item.status !== "cancelled" &&
        item.status !== "unavailable",
    ) ?? []
  );
}

export function DinerPaymentExperience({
  restaurantName,
  returnStatus,
  tableId,
  tipOptions,
}: DinerPaymentExperienceProps) {
  const { data: sessionData, error: sessionError } = useDinerSession(tableId);
  const orderQuery = useDinerOrder(Boolean(sessionData), tableId);
  const defaultTipOption = tipOptions.find((option) => option > 0) ?? tipOptions[0] ?? 0;
  const [tipMode, setTipMode] = useState<number | "custom">(defaultTipOption);
  const [customTip, setCustomTip] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(() => {
    if (returnStatus === "failure") {
      return "El pago no se pudo completar. Podes intentarlo otra vez.";
    }

    if (returnStatus === "pending") {
      return "Tu pago quedo pendiente de confirmacion. Revisamos el estado automaticamente.";
    }

    return null;
  });

  const paymentStatusQuery = useQuery({
    queryKey: ["diner-payment-status", tableId],
    queryFn: async () =>
      dinerPaymentStatusResponseSchema.parse(
        await fetchJson<unknown>("/api/diner/payment/status"),
      ),
    enabled:
      !orderQuery.isLoading &&
      !orderQuery.error &&
      (returnStatus !== null || orderQuery.data?.sessionStatus === "paid"),
    refetchInterval:
      returnStatus === "pending" || orderQuery.data?.sessionStatus === "paid"
        ? 5_000
        : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const tipPercentage = useMemo(() => {
    if (tipMode !== "custom") {
      return tipMode;
    }

    const parsed = Number(customTip);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return parsed;
  }, [customTip, tipMode]);

  const subtotal = orderQuery.data?.subtotal ?? 0;
  const tipAmount = Number(((subtotal * tipPercentage) / 100).toFixed(2));
  const finalTotal = Number((subtotal + tipAmount).toFixed(2));
  const visibleItems = getVisibleItems(orderQuery.data);

  async function handleCheckout() {
    setIsRedirecting(true);
    setFeedback(null);

    try {
      const response = dinerPaymentCheckoutResponseSchema.parse(
        await fetchJson<unknown>("/api/diner/payment/checkout", {
          body: JSON.stringify({ tip: tipPercentage }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      );

      window.location.href = response.checkoutUrl;
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar el pago con Mercado Pago.",
      );
      setIsRedirecting(false);
    }
  }

  const paymentStatus = paymentStatusQuery.data?.payment?.status ?? null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-[1.75rem] border border-border/80 bg-card/95 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {restaurantName}
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Pago de la cuenta</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Elegi la propina y completa el pago con Mercado Pago desde tu celular.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/t/${tableId}/order`}>Volver al pedido</Link>
          </Button>
        </div>
      </header>

      {sessionError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {sessionError}
          </CardContent>
        </Card>
      ) : null}

      {orderQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Cargando el detalle final de la cuenta...
          </CardContent>
        </Card>
      ) : null}

      {orderQuery.error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {orderQuery.error instanceof Error
              ? orderQuery.error.message
              : "No pudimos cargar la cuenta."}
          </CardContent>
        </Card>
      ) : null}

      {!orderQuery.isLoading && !orderQuery.error ? (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Detalle final</CardTitle>
              <CardDescription>Revisa los items antes de pasar al checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderQuery.data?.sessionStatus === "open" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Caja todavia no cerro la cuenta. Pedi la cuenta desde el pedido y espera la confirmacion.
                </div>
              ) : null}

              {orderQuery.data?.sessionStatus === "paid" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Esta mesa ya figura como pagada.
                </div>
              ) : null}

              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{item.nameSnapshot}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.qty} x {formatCurrency(item.priceSnapshot)}
                      </p>
                      {item.notes ? (
                        <p className="mt-1 text-sm italic text-muted-foreground">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.qty * item.priceSnapshot)}
                    </p>
                  </div>
                ))}

                {visibleItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay items facturables en esta mesa todavia.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle>Propina y total</CardTitle>
              <CardDescription>
                La propina es opcional y el total final se recalcula en el servidor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-2">
                {tipOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={tipMode === option ? "default" : "outline"}
                    onClick={() => setTipMode(option)}
                  >
                    {option}% propina
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={tipMode === "custom" ? "default" : "outline"}
                  onClick={() => setTipMode("custom")}
                >
                  Otro %
                </Button>
              </div>

              {tipMode === "custom" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="custom-tip">
                    Propina personalizada
                  </label>
                  <Input
                    id="custom-tip"
                    inputMode="decimal"
                    max={100}
                    min={0}
                    step="0.5"
                    type="number"
                    value={customTip}
                    onChange={(event) => setCustomTip(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Propina ({tipPercentage}%)</span>
                  <span className="font-semibold">{formatCurrency(tipAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-base font-medium">Total final</span>
                  <span className="text-2xl font-black text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {feedback ? (
                <p
                  className={`text-sm ${
                    feedback.toLowerCase().includes("pendiente")
                      ? "text-amber-700"
                      : feedback.toLowerCase().includes("no")
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {feedback}
                </p>
              ) : null}

              {paymentStatus === "approved" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Pago aprobado. Ya podes ver el comprobante final.
                </div>
              ) : null}

              {paymentStatus === "rejected" || paymentStatus === "cancelled" ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  El ultimo intento de pago no fue aprobado. Podes volver a intentarlo.
                </div>
              ) : null}

              {paymentStatus === "pending" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Mercado Pago sigue procesando el cobro.
                </div>
              ) : null}

              {orderQuery.data?.sessionStatus === "paid" || paymentStatus === "approved" ? (
                <Button asChild className="w-full">
                  <Link href={`/t/${tableId}/done`}>Ver comprobante</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    isRedirecting ||
                    visibleItems.length === 0 ||
                    orderQuery.data?.sessionStatus !== "awaiting_payment"
                  }
                  onClick={() => void handleCheckout()}
                >
                  {isRedirecting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Redirigiendo a Mercado Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Pagar con Mercado Pago
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
