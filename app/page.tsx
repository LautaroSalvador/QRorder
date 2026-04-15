import Link from "next/link";

import { ChefHat, CreditCard, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";

const featureCards = [
  {
    description: "Cada mesa tiene su código único. Sin apps, sin registro.",
    icon: QrCode,
    title: "QR por mesa",
  },
  {
    description: "Los pedidos llegan al instante a quien corresponde.",
    icon: ChefHat,
    title: "Cocina y barra en tiempo real",
  },
  {
    description: "El comensal paga desde su celular al terminar.",
    icon: CreditCard,
    title: "Pago con Mercado Pago",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative isolate flex min-h-screen items-center">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_88%,white)_0%,var(--background)_100%)]" />
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl md:size-[28rem]" />
          <div className="absolute right-[-6rem] top-[-4rem] size-80 rounded-full border border-primary/10 bg-card/70 blur-2xl md:size-[34rem]" />
          <svg
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-[60vh] w-[60vw] text-primary/10"
            viewBox="0 0 600 600"
          >
            <defs>
              <pattern
                id="mesaqr-dots"
                width="26"
                height="26"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="3" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="600" height="600" fill="url(#mesaqr-dots)" />
          </svg>
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-10 md:px-10 md:py-16">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold tracking-[0.18em] text-primary uppercase">
              MesaQR
            </p>
          </div>

          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="w-fit rounded-full border border-primary/15 bg-card/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
                  Experiencia simple para salón, cocina y caja
                </p>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance md:text-7xl md:leading-[0.95]">
                  Pedidos en mesa, sin fricción.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-xl">
                  Tus comensales escanean, eligen y pagan. Tu cocina recibe,
                  prepara y entrega.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/staff/login">Ingresar como staff</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-8 -z-10 h-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-[0_24px_90px_rgba(80,49,32,0.12)] backdrop-blur md:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <QrCode className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                        Flujo QR
                      </p>
                      <p className="text-lg font-semibold">
                        Desde la mesa hasta el pago
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-[1.5rem] bg-muted-surface p-4">
                      <p className="text-sm font-medium text-primary">
                        1. Escanean y piden
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Menú ordenado por categorías, carrito compartido y
                        pedido confirmado desde el celular.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-secondary/70 p-4">
                      <p className="text-sm font-medium text-primary">
                        2. Barra y cocina responden
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Cada área recibe sólo lo suyo y actualiza estados con una
                        interfaz clara.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-primary/10 bg-background/90 p-4">
                      <p className="text-sm font-medium text-primary">
                        3. Pagan sin esperar
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        El cierre de la cuenta vive en la misma experiencia y se
                        integra con Mercado Pago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10 md:py-24">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Lo esencial del servicio
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Una operación más ágil para el equipo y más cómoda para el cliente.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map(({ description, icon: Icon, title }) => (
            <article
              key={title}
              className="group rounded-[1.75rem] border border-border/80 bg-card/85 p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground md:px-10 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-foreground/80">
                MesaQR
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
                ¿Listo para empezar?
              </h2>
            </div>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/staff/login">Ingresar como staff</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 px-6 py-8 text-center text-sm text-muted-foreground md:px-10">
        MesaQR — Producto de beWeb
      </footer>
    </main>
  );
}
