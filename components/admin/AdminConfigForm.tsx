"use client";

import { CreditCard, Loader2, Settings2, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetcher";

type AdminConfigFormProps = {
  barNotificationsEnabled: boolean;
  hasAccessToken: boolean;
  hasPublicKey: boolean;
  kitchenNotificationsEnabled: boolean;
  restaurantName: string;
  tipOptions: number[];
};

function normalizeTipOptionsInput(value: string) {
  return [...new Set(
    value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item >= 0 && item <= 100),
  )].sort((left, right) => left - right);
}

export function AdminConfigForm({
  barNotificationsEnabled,
  hasAccessToken,
  hasPublicKey,
  kitchenNotificationsEnabled,
  restaurantName,
  tipOptions,
}: AdminConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [localRestaurantName, setLocalRestaurantName] = useState(restaurantName);
  const [localTipOptions, setLocalTipOptions] = useState(tipOptions.join(", "));
  const [localKitchenNotifications, setLocalKitchenNotifications] = useState(
    kitchenNotificationsEnabled,
  );
  const [localBarNotifications, setLocalBarNotifications] = useState(
    barNotificationsEnabled,
  );
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");

  const parsedTipPreview = useMemo(
    () => normalizeTipOptionsInput(localTipOptions),
    [localTipOptions],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorFeedback(null);

    const payload: Record<string, unknown> = {
      barNotificationsEnabled: localBarNotifications,
      kitchenNotificationsEnabled: localKitchenNotifications,
      restaurantName: localRestaurantName,
      tipOptions: parsedTipPreview,
    };

    if (mpAccessToken.trim()) {
      payload.mpAccessToken = mpAccessToken.trim();
    }

    if (mpPublicKey.trim()) {
      payload.mpPublicKey = mpPublicKey.trim();
    }

    try {
      await fetchJson("/api/staff/admin/config", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      setMpAccessToken("");
      setMpPublicKey("");
      router.refresh();
    } catch (error) {
      setErrorFeedback(error instanceof Error ? error.message : "Ocurrio un error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8 pb-12" onSubmit={onSubmit}>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Store className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Datos del restaurante
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estos datos impactan en la experiencia del comensal.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                htmlFor="restaurant-name"
              >
                Nombre visible
              </label>
              <Input
                id="restaurant-name"
                value={localRestaurantName}
                onChange={(event) => setLocalRestaurantName(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
                <Settings2 className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Flujo operativo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Propinas sugeridas y alertas de cocina/barra.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                  htmlFor="tip-options"
                >
                  Propinas sugeridas
                </label>
                <Input
                  id="tip-options"
                  value={localTipOptions}
                  onChange={(event) => setLocalTipOptions(event.target.value)}
                  placeholder="0, 10, 15"
                />
                <p className="text-xs text-muted-foreground">
                  Separalas con coma. Vista previa:{" "}
                  {parsedTipPreview.length > 0 ? parsedTipPreview.join("%, ") + "%" : "sin valores validos"}
                </p>
              </div>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                <div>
                  <p className="font-medium text-foreground">Notificaciones en cocina</p>
                  <p className="text-sm text-muted-foreground">
                    Guarda la preferencia para alertar nuevos pedidos.
                  </p>
                </div>
                <input
                  checked={localKitchenNotifications}
                  className="size-4"
                  type="checkbox"
                  onChange={(event) =>
                    setLocalKitchenNotifications(event.target.checked)
                  }
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                <div>
                  <p className="font-medium text-foreground">Notificaciones en barra</p>
                  <p className="text-sm text-muted-foreground">
                    Guarda la preferencia para bebidas listas y nuevos pedidos.
                  </p>
                </div>
                <input
                  checked={localBarNotifications}
                  className="size-4"
                  type="checkbox"
                  onChange={(event) => setLocalBarNotifications(event.target.checked)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#009EE3]/10 p-3 text-[#009EE3]">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Mercado Pago
                </h3>
                <p className="text-sm text-muted-foreground">
                  Las credenciales se guardan cifradas en base de datos.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>
                Access token:{" "}
                <span className="font-medium text-foreground">
                  {hasAccessToken ? "configurado" : "pendiente"}
                </span>
              </p>
              <p className="mt-1">
                Public key:{" "}
                <span className="font-medium text-foreground">
                  {hasPublicKey ? "configurada" : "pendiente"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                htmlFor="mp-access-token"
              >
                Nuevo access token
              </label>
              <Input
                id="mp-access-token"
                placeholder={hasAccessToken ? "********" : "APP_USR-..."}
                value={mpAccessToken}
                onChange={(event) => setMpAccessToken(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                htmlFor="mp-public-key"
              >
                Nueva public key
              </label>
              <Input
                id="mp-public-key"
                placeholder={hasPublicKey ? "********" : "APP_USR-..."}
                value={mpPublicKey}
                onChange={(event) => setMpPublicKey(event.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Si dejas un campo vacio, esa credencial no se modifica.
            </div>
          </div>
        </section>
      </div>

      {errorFeedback ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorFeedback}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button className="min-w-44" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Guardar configuracion
        </Button>
      </div>
    </form>
  );
}
