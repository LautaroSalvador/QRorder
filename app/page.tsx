import Link from "next/link";

import { ArrowRight, QrCode, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-border/80 bg-card/90 p-8 shadow-[0_24px_80px_rgba(113,64,32,0.12)] backdrop-blur md:grid-cols-[1.3fr_0.7fr] md:p-12">
        <div className="space-y-6">
          <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
            Fase 0 lista para iterar
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              MesaQR, la base del flujo QR para salón, cocina y caja.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Proyecto inicializado con Next.js 15, TypeScript estricto,
              Supabase SSR, JWT para comensal y estructura lista para avanzar a
              Fase 1.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 rounded-full px-7">
              <Link href="/staff/login">
                Ir al login de staff
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-7"
            >
              <Link href="/t/00000000-0000-0000-0000-000000000001">
                Ver vista de mesa
              </Link>
            </Button>
          </div>
        </div>
        <Card className="border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,241,234,0.95))]">
          <CardHeader>
            <CardTitle className="text-lg">Estado del setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-muted-surface p-4">
              <ShieldCheck className="mt-0.5 size-5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Autenticación preparada</p>
                <p className="text-sm text-muted-foreground">
                  Staff con Supabase SSR y comensal con JWT httpOnly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-muted-surface p-4">
              <QrCode className="mt-0.5 size-5 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Rutas del MVP creadas</p>
                <p className="text-sm text-muted-foreground">
                  Estructura alineada con el anexo 15.2 del PRD.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
