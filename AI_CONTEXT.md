# AI Context — MesaQR

Este archivo resume el estado actual del proyecto para retomar trabajo después de una compactación de contexto.
Consultar este archivo al inicio de futuras tareas para refrescar memoria.

## Proyecto

- Nombre: `MesaQR`
- Tipo: web app de pedidos en mesa para bar/restaurante
- Stack:
  - Next.js 15 App Router
  - TypeScript estricto
  - Supabase (DB + Auth + Storage)
  - React Query v5
  - Zustand
  - Tailwind CSS + shadcn/ui
  - `jose` para JWT de comensal
- MVP sin realtime
- Sin multi-tenant
- Sin acceso directo del browser a Supabase para flujo diner
- Polling estándar: `5000ms`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`

## Reglas importantes

- Seguir `AGENTS.md` y `PRD.md`
- Validar inputs con Zod en handlers
- Nunca usar `any`
- `service_role_key` solo server-side
- RLS activa como segunda línea de defensa
- UI en español argentino
- Código y nombres internos en inglés

## Fases implementadas

### Fase 0

- Setup base del proyecto
- Next.js 15 + TS estricto + Tailwind + shadcn/ui
- Supabase SSR
- middleware para staff
- JWT de comensal
- login de staff
- migración inicial

### Fase 1

- Backbone admin implementado
- CRUD de:
  - categorías
  - ítems de menú
  - mesas
  - usuarios staff
- bucket de imágenes `menu-images`

### Fase 2

- Flujo core del comensal implementado
- Entrada por QR `/t/[tableId]`
- apertura/reanudación de sesión
- menú agrupado por categoría
- carrito local con Zustand
- persistencia real en DB
- confirmación de pedido
- polling del pedido actual

### Fase 3A

- Vista de barra implementada
- endpoint `/api/staff/bar/items`
- hooks/componentes:
  - `components/bar/useBarQueue.ts`
  - `components/bar/BarItemCard.tsx`
  - `components/bar/BarKanban.tsx`
- fix importante:
  - en `app/api/staff/bar/items/route.ts` el join a mesas debe usar FK explícita
  - se corrigió usando `tables!table_sessions_table_id_fkey`

## Navegación staff

- Se agregó navegación estructurada para staff
- `admin` ve todas las secciones
- `barra`, `cocina`, `cajero` ven solo su área
- layout protegido vive en:
  - `app/(staff)/staff/(protected)/layout.tsx`
- `/staff/login` quedó afuera del layout protegido
- archivos relevantes:
  - `components/staff/StaffSidebar.tsx`
  - `components/staff/StaffSidebarNav.tsx`
  - `components/staff/StaffBottomNav.tsx`
  - `components/staff/StaffSignOutButton.tsx`
  - `lib/staff-navigation.ts`

## Landing pública

- `app/page.tsx` fue rediseñada
- Estética cálida gastronómica
- Hero + features + CTA final
- Botón a `/staff/login`

## Caja / Cashier

### Contexto importante

- El usuario pidió varias veces cambios sobre archivos llamados:
  - `components/cashier/FloorCanvas.tsx`
  - `components/cashier/TableDetailPanel.tsx`
- En este repo esos archivos no existen
- Los equivalentes reales son:
  - `components/cashier/TableMap.tsx`
  - `components/cashier/TableDrawer.tsx`

### Estado actual

- Se rediseñó solo la parte visual de caja manteniendo lógica intacta
- Archivos modificados:
  - `components/cashier/TableMap.tsx`
  - `components/cashier/TableDrawer.tsx`

### Qué se hizo en `TableMap.tsx`

- Fondo tipo canvas con puntos
- marco blanco grueso
- mesas más grandes
- badge superior por estado
- borde inferior con color por estado
- selección visual con ring
- layout absoluto si hay coordenadas `pos_x/pos_y`
- layout grid como fallback
- se agregó margen derecho en desktop para convivir con el panel fijo

### Qué se hizo en `TableDrawer.tsx`

- Rediseño visual fuerte del panel
- En desktop:
  - panel fijo a la derecha
  - ancho `440px`
  - estado vacío visible aunque no haya mesa seleccionada
- En mobile:
  - sigue usando `Sheet`
- Se mantuvieron intactos:
  - `useCashierTableDetail`
  - `useCloseTable`
  - `useMarkPaidOffline`
  - `useResetTable`
  - `AddItemDialog`
  - `EditItemDialog`
- No se tocaron endpoints ni tipos

### Importante sobre estados visuales de mesa

- El schema real de caja usa:
  - `available`
  - `occupied`
  - `awaiting_payment`
  - `closed`
- Para aproximar el diseño pedido:
  - `available` => libre
  - `occupied` con `active_item_count === 0` => ocupada
  - `occupied` con `active_item_count > 0` => en curso
  - `awaiting_payment` => cuenta
  - `closed` => cerrada/pagada

## Admin

- El admin ve toda la app web desde la navegación
- Además de secciones administrativas, también tiene acceso a:
  - `/staff/cashier`
  - `/staff/kitchen`
  - `/staff/bar`
- Se agregó también acceso desde el dashboard admin

## Mesas y QR

- Se agregó botón `Ver QR` en la lista de mesas
- Archivo nuevo:
  - `components/admin/TableQRModal.tsx`
- Componente de lista actualizado:
  - `components/admin/TablesManager.tsx`
- Usa `qrcode` para generar `dataURL`
- Usa `NEXT_PUBLIC_APP_URL` y fallback a `http://localhost:3000`

## Dev server y Tailscale

- `.env.local` fue actualizado para usar:
  - `NEXT_PUBLIC_APP_URL=http://100.107.124.95:3000`
- `package.json` script `dev` quedó:
  - `next dev --turbopack --hostname 0.0.0.0`
- Hubo una confusión previa donde el puerto no respondía porque el dev server no estaba levantado

## Seed

- Existe `supabase/seed.sql`
- Crea:
  - 6 categorías
  - 18 ítems de menú
  - 8 mesas
- Se armó idempotente
- No se pudo ejecutar localmente en esta máquina porque:
  - faltaba Docker para `supabase db reset`
  - faltaba `psql` en `PATH`

## Caveats / notas útiles

- Si el usuario vuelve a mencionar `FloorCanvas.tsx` o `TableDetailPanel.tsx`, mapearlos a `TableMap.tsx` y `TableDrawer.tsx`
- En caja, `CashierView.tsx` sigue mostrando una leyenda externa además de la interna del canvas
- La lógica de caja no fue alterada en el último rediseño; solo cambió presentación
- Si se trabaja nuevamente en barra, recordar que el join a `tables` debe ser explícito para evitar el error:
  - `Could not embed because more than one relationship was found for 'table_sessions' and 'tables'`

## Verificaciones recientes

- En el último cambio grande de caja:
  - `npm run typecheck` pasó
  - `npm run lint` pasó

## Recomendación para futuras sesiones

- Antes de tocar nuevas áreas:
  - leer este archivo
  - leer `AGENTS.md`
  - si el cambio es funcional, revisar también `PRD.md`
