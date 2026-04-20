"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dinerPaymentStatusResponseSchema,
  type DinerPaymentStatusResponse,
} from "@/lib/validations/diner";

type DinerPaymentDoneProps = {
  tableId: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(value);
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getPaymentStatusLabel(
  status: "pending" | "approved" | "rejected" | "cancelled",
  provider: "mercadopago" | "offline",
): string {
  if (provider === "offline" && status === "approved") {
    return "Pagado en efectivo";
  }

  switch (status) {
    case "approved":
      return "Aprobado";
    case "rejected":
      return "Rechazado";
    case "cancelled":
      return "Cancelado";
    default:
      return "Pendiente";
  }
}

export function DinerPaymentDone({ tableId }: DinerPaymentDoneProps) {
  const [isClearing, setIsClearing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<DinerPaymentStatusResponse | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const paymentResponse = await fetch("/api/diner/payment/status");

        if (paymentResponse.ok) {
          const payload = dinerPaymentStatusResponseSchema.parse(
            await paymentResponse.json(),
          );

          if (active) {
            setPaymentStatus(payload);
          }
        }
      } finally {
        await fetch("/api/diner/session/clear", {
          method: "POST",
        }).catch(() => undefined);

        if (active) {
          setIsClearing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const payment = paymentStatus?.payment ?? null;
  const paymentReference = payment
    ? payment.id.slice(0, 8).toUpperCase()
    : tableId.slice(0, 8).toUpperCase();
  const paymentStatusLabel = payment
    ? getPaymentStatusLabel(payment.status, payment.provider)
    : null;
  const paidAtLabel = payment ? formatDateTime(payment.createdAt) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6">
      <Card className="border-emerald-200 bg-card/95 shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </div>
          <CardTitle className="text-3xl font-semibold">Pago recibido</CardTitle>
          <CardDescription className="max-w-xl text-base">
            Gracias por tu visita. La cuenta quedo cerrada y el personal ya puede resetear la mesa para el proximo servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {isClearing && !payment ? (
            <div className="flex items-center justify-center gap-2 rounded-[1.5rem] border border-border/70 bg-muted/30 px-4 py-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Cargando comprobante…
            </div>
          ) : (
            <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-muted/30 px-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Referencia</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em]">
                  {paymentReference}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="mt-2 text-sm font-semibold">
                  {paymentStatusLabel ?? "Sin datos"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="mt-2 text-sm font-semibold">
                  {paidAtLabel ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatCurrency(payment?.amount ?? paymentStatus?.orderTotal ?? 0)}
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Este comprobante no reemplaza una factura legal. Si necesitas ayuda, podes acercarte a caja.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/t/${tableId}`}>Ver la mesa</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {isClearing ? (
              <>
                <LoaderCircle className="size-3 animate-spin" />
                Cerrando tu sesion local...
              </>
            ) : (
              "La sesion del comensal ya quedo cerrada en este dispositivo."
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
