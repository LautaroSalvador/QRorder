import { LayoutGrid, Wallet, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CashierSetupCard() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div>
        <Badge variant="secondary" className="mb-3">
          Staff · caja
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Caja lista para la Fase 4
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          El acceso ya está protegido por middleware y autenticación SSR. En la
          siguiente fase entra el layout visual del salón, polling y acciones de
          cierre de mesa.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: LayoutGrid,
            title: "Mapa del salón",
            text: "Preparado para renderizar mesas y estados por color.",
          },
          {
            icon: Wallet,
            title: "Cobro y cierre",
            text: "Base lista para Mercado Pago y cobros offline.",
          },
          {
            icon: WandSparkles,
            title: "Acciones de staff",
            text: "Se integrarán con auditoría y validación en route handlers.",
          },
        ].map(({ icon: Icon, text, title }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Icon className="size-5 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {text}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
