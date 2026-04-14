# AGENTS.md — MesaQR

Guía de trabajo para Agente IA en este repositorio. Leer **antes** de cualquier sesión.

## Contexto del proyecto

**MesaQR** es una web app de pedidos en mesa para bar/restaurante. Los comensales escanean un QR pegado en la mesa, ven el menú, arman un pedido colaborativo entre varios celulares, lo envían a cocina/barra y al final pagan con Mercado Pago Checkout Pro. El staff (cocina, barra, caja, admin) opera la app desde tablets/PCs con sincronización **por polling cada 5 segundos** (sin realtime en MVP).

Es un MVP **single-tenant, single-sucursal**, producto académico/interno de **beWeb**. El equipo está aprendiendo el stack: priorizar claridad sobre cleverness.

Ver `PRD.md` para la especificación completa.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript estricto
- **DB:** Supabase Postgres (acceso server-side con `service_role_key`)
- **Auth staff:** Supabase Auth (email + password) + `@supabase/ssr`
- **Auth comensal:** JWT custom firmado con `jose`, cookie httpOnly
- **Storage de imágenes:** Supabase Storage
- **UI:** Tailwind CSS + shadcn/ui + Lucide
- **State:** Zustand (carrito local) + React Query v5 (server state + polling)
- **Validación:** Zod en todos los route handlers y forms
- **Pagos:** Mercado Pago SDK Node oficial
- **Hosting:** Vercel (free tier)
- **Node:** 20 LTS

**Sin realtime en MVP.** Toda sincronización entre clientes va por **polling de 5 segundos** con React Query.

## Reglas de oro

1. **TypeScript estricto.** `strict: true`, `noUncheckedIndexedAccess: true`. Nunca `any`. Si necesitás escapar el tipo, usá `unknown` y validá con Zod.
2. **Validar todo input con Zod.** En cada route handler, parsear `body`, `params` y `searchParams` con un schema. Si falla, devolver `400` con mensaje claro.
3. **Server-side recalcula totales.** El cliente nunca decide precios, totales, propinas finales. Siempre se recalcula desde la DB.
4. **El browser nunca habla directo con Supabase.** Toda lectura/escritura del comensal pasa por route handlers de Next.js. Para staff, usar `@supabase/ssr` que mantiene la sesión en cookies httpOnly.
5. **`service_role_key` solo en server.** Nunca importarla en componentes cliente ni exponerla. Vive en `lib/supabase/admin.ts`.
6. **RLS activada en todas las tablas** como segunda línea de defensa. Default-deny. La autorización primaria vive en route handlers.
7. **Polling con React Query.** Usar `refetchInterval: 5000`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`. Pausar polling cuando no aplica (sin sesión, drawer cerrado, etc.).
8. **Snapshots de precio/nombre.** Cuando un ítem del menú entra a una orden, se copian `name_snapshot` y `price_snapshot`. Cambios futuros del menú no afectan órdenes pasadas.
9. **Idempotencia en webhooks.** El webhook de Mercado Pago debe ser idempotente: si llega dos veces el mismo `external_id`, no procesar dos veces.
10. **UI en español argentino.** Todo el texto visible al usuario en español. Código, comentarios y nombres de variables en inglés.
11. **Auditoría.** Toda modificación de pedidos por staff sobre ítems ya `accepted` debe registrarse en `audit_log` y `order_item_events` con motivo.

## Convenciones de código

### Naming

- **Archivos:** `kebab-case.ts` para utils, `PascalCase.tsx` para componentes React.
- **Componentes:** `PascalCase`.
- **Variables y funciones:** `camelCase`.
- **Tipos:** `PascalCase`. Preferir `type` sobre `interface` salvo extensión.
- **Constantes globales:** `UPPER_SNAKE_CASE`.
- **Tablas DB:** `snake_case` plural (`order_items`).
- **Columnas DB:** `snake_case`.

### Estructura de route handlers

```ts
// app/api/diner/order/items/route.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getDinerSession } from '@/lib/auth/diner-jwt';
import { supabaseAdmin } from '@/lib/supabase/admin';

const bodySchema = z.object({
  menuItemId: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
  notes: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getDinerSession(req);
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Sesión inválida' } },
      { status: 401 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    );
  }

  // ... lógica con supabaseAdmin
}
```

### Patrón de polling con React Query

```ts
// components/kitchen/use-kitchen-queue.ts
export function useKitchenQueue() {
  return useQuery({
    queryKey: ['kitchen-items'],
    queryFn: async () => {
      const res = await fetch('/api/staff/kitchen/items');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
```

### Errores

Formato uniforme:

```ts
{ error: { code: string, message: string } }
```

Códigos: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `CONFLICT`, `INTERNAL`.

### Imports

Orden: librerías externas → alias internos (`@/...`) → relativos. Separados por línea en blanco.

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Completar con credenciales de Supabase y Mercado Pago de sandbox

# 3. Aplicar migraciones a Supabase (staging)
npx supabase db push

# 4. Levantar dev server
npm run dev
```

## Comandos importantes

```bash
npm run dev          # dev server con turbopack
npm run build        # build de producción
npm run lint         # eslint
npm run typecheck    # tsc --noEmit (correr antes de cada commit)
npm run test         # vitest
npx supabase db push # aplicar migraciones
```

## Antes de hacer commit

1. `npm run typecheck` debe pasar sin errores.
2. `npm run lint` debe pasar sin warnings.
3. Si tocaste el schema, agregá una migración nueva en `supabase/migrations/`. **Nunca** edites una migración ya commiteada.
4. Si agregaste un endpoint, verificá que tiene auth, validación Zod y manejo de errores.
5. Si agregaste una pantalla con datos vivos, verificá que usa polling con React Query y tiene botón "↻ Actualizar" visible.

## Cómo trabajamos con Agentes IA

- **Una tarea por sesión.** Antes de pedirme que codee algo, validemos el plan: qué archivos voy a tocar, qué endpoints, qué tablas.
- **Fases incrementales.** El PRD tiene fases (0 a 6). Trabajamos una a la vez, no saltamos.
- **PRD primero.** Cualquier cambio funcional importante se discute y se actualiza en `PRD.md` antes de codear.
- **Preguntas antes que asunciones.** Si algo del PRD es ambiguo, preguntar antes de codear.
- **No tocar producción de Supabase sin avisar.** Las migraciones se aplican primero a un proyecto de staging.

## Decisiones tomadas (no reabrir sin justificación)

- **Next.js App Router** sobre Pages Router.
- **Supabase** como DB + Auth + Storage (un solo proveedor).
- **Polling cada 5s con React Query** en lugar de Supabase Realtime. La migración a realtime queda en TODO post-MVP.
- **Sin Prisma** en MVP (cliente Supabase + tipos generados alcanzan).
- **Sin NestJS** (overkill para el tamaño).
- **Sin Redis/colas** en MVP.
- **El browser nunca habla directo con Supabase.** Todo pasa por route handlers de Next.js.
- **JWT custom para comensal** (no Supabase Auth, para no inflar usuarios).
- **URL del QR físico = `/t/{tableId}` con UUID estable.** El QR no se reimprime al resetear la mesa.
- **Una orden por sesión de mesa.** Los ítems tienen estado individual, no hay entidad "tanda".
- **`name_snapshot` y `price_snapshot`** en `order_items`.

## Lo que NO hace este MVP (no agregar sin discutir)

Ver sección 14 del PRD. Los grandes ausentes: realtime, multi-tenant, AFIP, impresión térmica, pagos parciales, variantes, stock, multi-idioma, offline, reservas, fidelidad.

## Referencias rápidas

- PRD completo: `./PRD.md`
- Esquema DB: `./supabase/migrations/`
- Diseño de interfaz: https://stitch.withgoogle.com/preview/6316511925762607689?node-id=02c44b8b375f460aac9a1feeb448d050
- Mercado Pago Checkout Pro: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
- Supabase con Next.js (SSR): https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js App Router: https://nextjs.org/docs/app
- React Query v5: https://tanstack.com/query/latest
- shadcn/ui: https://ui.shadcn.com