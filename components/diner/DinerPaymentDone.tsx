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

type DinerPaymentDoneProps = {
  tableId: string;
};

export function DinerPaymentDone({ tableId }: DinerPaymentDoneProps) {
  const [isClearing, setIsClearing] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await fetch("/api/diner/session/clear", {
          method: "POST",
        });
      } finally {
        if (active) {
          setIsClearing(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6">
      <Card className="border-emerald-200 bg-card/95 shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </div>
          <CardTitle className="text-3xl font-semibold">
            Pago recibido
          </CardTitle>
          <CardDescription className="max-w-xl text-base">
            Gracias por tu visita. La cuenta quedó cerrada y el personal ya puede
            resetear la mesa para el próximo servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/30 px-4 py-5">
            <p className="text-sm text-muted-foreground">
              Referencia de tu visita
            </p>
            <p className="mt-2 text-lg font-semibold uppercase tracking-[0.18em]">
              {tableId.slice(0, 8)}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Este comprobante no reemplaza una factura legal. Si necesitás ayuda,
            podés acercarte a caja.
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
                Cerrando tu sesión local...
              </>
            ) : (
              "La sesión del comensal ya quedó cerrada en este dispositivo."
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
