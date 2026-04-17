"use client";

import {
  AlertCircle,
  CreditCard,
  Eye,
  Globe,
  Loader2,
  Lock,
  Settings,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetcher";

type AdminConfigFormProps = {
  hasAccessToken: boolean;
  mpPublicKey: string | null;
};

export function AdminConfigForm({
  hasAccessToken,
  mpPublicKey,
}: AdminConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [localPublicKey, setLocalPublicKey] = useState(mpPublicKey ?? "");
  const [showToken, setShowToken] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorFeedback(null);

    try {
      const payload: Record<string, string> = {};

      if (mpAccessToken) {
        payload.mpAccessToken = mpAccessToken;
      }

      if (localPublicKey !== undefined) {
        payload.mpPublicKey = localPublicKey;
      }

      if (Object.keys(payload).length > 0) {
        await fetchJson("/api/staff/admin/config", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
      }

      setMpAccessToken("");
      router.refresh();
    } catch (error) {
      setErrorFeedback(error instanceof Error ? error.message : "Ocurrio un error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8 pb-12" onSubmit={onSubmit}>
      <div className="absolute right-6 top-[6.5rem] sm:right-8 lg:right-12">
        <Button
          className="h-11 rounded-xl px-6 font-medium shadow-md shadow-primary/20"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="rounded-3xl bg-card p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Store className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Identidad del restaurante
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre legal
                </label>
                <Input
                  className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 text-md font-medium focus-visible:ring-primary/20"
                  defaultValue="MesaQR Demo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email de contacto
                </label>
                <Input
                  className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 text-sm focus-visible:ring-primary/20"
                  defaultValue="admin@mesaqr.local"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Telefono
                </label>
                <Input
                  className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 text-sm focus-visible:ring-primary/20"
                  defaultValue="+54 11 5555 5555"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Direccion
                </label>
                <Input
                  className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 text-sm focus-visible:ring-primary/20"
                  defaultValue="Av. Demo 1234, Buenos Aires"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-full rounded-3xl border border-border/40 bg-muted-surface/40 p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
                <Settings className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Flujo operativo</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sugerencias de propina
                </label>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
                    10%
                  </div>
                  <div className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                    15%
                  </div>
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
                    20%
                  </div>
                  <div className="rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                    25%
                  </div>
                  <div className="rounded-full border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                    Personalizada
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sonidos de notificacion
                </label>

                <div className="flex items-center justify-between rounded-2xl border border-transparent bg-card p-4 shadow-sm transition-colors hover:border-border">
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-destructive" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        Terminal de cocina
                      </span>
                      <span className="mt-0.5 text-[11px] text-muted-foreground">
                        Campanilla al entrar un nuevo pedido
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 w-10 rounded-full bg-primary shadow-inner">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-transparent bg-card p-4 shadow-sm transition-colors hover:border-border">
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        Terminal de barra
                      </span>
                      <span className="mt-0.5 text-[11px] text-muted-foreground">
                        Alerta sutil para bebidas
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 w-10 rounded-full bg-secondary-foreground/20 shadow-inner">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-[#009EE3] p-2 text-white shadow-md shadow-[#009EE3]/20">
              <CreditCard className="size-6" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Integracion Mercado Pago
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Checkout seguro para tus clientes.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-green-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
            {hasAccessToken ? "Activa" : "Inactiva"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
              htmlFor="mpAccessToken"
            >
              Access token <Lock className="size-3" />
            </label>
            <div className="relative">
              <Input
                className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 pr-12 font-mono text-md tracking-wider placeholder:tracking-normal focus-visible:ring-primary/20"
                id="mpAccessToken"
                name="mpAccessToken"
                onChange={(event) => setMpAccessToken(event.target.value)}
                placeholder={hasAccessToken ? "*****************************" : "APP_USR-..."}
                type={showToken ? "text" : "password"}
                value={mpAccessToken}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowToken((current) => !current)}
                type="button"
              >
                <Eye className="size-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] italic text-muted-foreground/70">
              Este token se cifra en reposo. No lo compartas con personal no
              autorizado.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
              htmlFor="mpPublicKey"
            >
              Public key <Globe className="size-3" />
            </label>
            <Input
              className="h-12 rounded-xl border-transparent bg-secondary/30 px-4 font-mono text-md text-muted-foreground focus-visible:ring-primary/20"
              id="mpPublicKey"
              name="mpPublicKey"
              onChange={(event) => setLocalPublicKey(event.target.value)}
              placeholder="APP_USR-..."
              type="text"
              value={localPublicKey}
            />
          </div>
        </div>

        {errorFeedback ? (
          <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {errorFeedback}
          </p>
        ) : null}

        <div className="mt-8 flex gap-4 rounded-xl border border-[#f5c697] bg-[#feead1]/50 p-4 text-[#a85a10]">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold tracking-tight">
              Nota de configuracion
            </span>
            <span className="text-xs leading-relaxed opacity-90">
              Verifica las callback URLs y el webhook de Mercado Pago antes de
              cobrar pedidos reales.
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-sm font-bold text-foreground">Gestion de datos</span>
          <span className="text-xs text-muted-foreground">
            Exporta configuraciones o limpia cache transitoria del sistema.
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            className="h-9 rounded-full border border-transparent bg-secondary px-5 text-xs font-semibold text-foreground shadow-sm hover:bg-border/60"
            type="button"
            variant="secondary"
          >
            Exportar config (JSON)
          </Button>
          <Button
            className="h-9 rounded-full border-destructive/20 px-5 text-xs font-semibold text-destructive shadow-sm hover:bg-destructive/5 hover:text-destructive"
            type="button"
            variant="outline"
          >
            Limpiar cache
          </Button>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-10 pt-16 pb-4 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          SISTEMA EN LINEA
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-destructive" />
          TERMINAL ADMIN V2.4.1
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-border" />
          ULTIMO BACKUP: HACE 14M
        </div>
      </div>
    </form>
  );
}
