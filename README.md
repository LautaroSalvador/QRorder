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
npm run dev
```

Node objetivo: 20 LTS.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
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

Si cambias el schema:

- agrega una migracion nueva en `supabase/migrations/`
- no edites migraciones ya commiteadas
