# MesaQR

MesaQR es un MVP de pedidos en mesa para bar/restaurante. Los comensales escanean un QR, ven el menu desde el celular, arman el pedido de forma colaborativa y pagan con Mercado Pago. Cocina, barra, caja y admin operan desde vistas staff protegidas con sincronizacion por polling cada 5 segundos.

## Stack

- Next.js 15 App Router
- TypeScript estricto
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- React Query v5 + Zustand
- Mercado Pago Checkout Pro

## Reglas clave

- El browser no habla directo con Supabase en el flujo diner.
- Todo input de APIs se valida con Zod.
- Totales, propinas y precios se recalculan siempre en server.
- `service_role_key` solo se usa del lado server.
- La UI visible debe quedar en espanol argentino.
- El polling estandar usa `refetchInterval: 5000`.

Antes de trabajar en el repo, leer:

- `AGENTS.md`
- `PRD.md`
- `AI_CONTEXT.md`

## Setup local

```bash
npm install
cp .env.example .env.local
npx supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
npm run dev
```

Node objetivo: 20 LTS.

## Scripts

```bash
npm run dev          # dev server con turbopack
npm run build        # build de produccion
npm run typecheck    # tsc --noEmit
npm run lint         # eslint con max-warnings=0
npm run test:run     # vitest run (una pasada, CI)
```

## Desarrollo en dispositivos moviles (Tailscale)

Para probar el flujo del comensal desde un celular en la misma red Tailscale,
exponer el dev server en la interfaz Tailscale y configurar la URL publica:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://{IP-tailscale}:3000
```

```bash
npm run dev -- --hostname 0.0.0.0
```

## Estructura principal

- `app/page.tsx`: landing publica
- `app/(public)/t/[tableId]/*`: flujo comensal
- `app/(staff)/staff/login/page.tsx`: login staff
- `app/(staff)/staff/(protected)/*`: vistas protegidas de staff
- `app/api/diner/*`: APIs del flujo comensal
- `app/api/staff/*`: APIs internas para staff
- `app/api/webhooks/mercadopago/route.ts`: webhook de Mercado Pago
- `components/diner/*`: experiencia del comensal
- `components/cashier/*`, `components/kitchen/*`, `components/bar/*`: vistas operativas
- `components/admin/*`: admin y configuracion
- `lib/auth/*`, `lib/supabase/*`, `lib/mercadopago.ts`: integraciones core
- `supabase/migrations/0001_initial.sql`: schema base
- `supabase/seed.sql`: datos de seed

## Pagos

- El access token de Mercado Pago se guarda en `restaurant_config.mp_access_token`.
- El token se desencripta server-side en `lib/mercadopago.ts`.
- `MP_WEBHOOK_SECRET` sale del entorno.
- El checkout diner vive en `app/api/diner/payment/checkout/route.ts`.

## Checklist rapido antes de commit

```bash
npm run typecheck
npm run lint
```

`npm run test` / `npm run test:run` apuntan a `vitest`. Todavia no hay una suite de tests automatizados versionada: los scripts quedan listos para cuando se instale `vitest` y se agreguen casos.

Si cambias el schema:

- agrega una migracion nueva en `supabase/migrations/`
- no edites migraciones ya commiteadas
