import { z } from "zod";

// ─── Shared item status ───────────────────────────────────────────────────────

export const orderItemStatusSchema = z.enum([
  "cart",
  "pending",
  "accepted",
  "in_progress",
  "ready",
  "delivered",
  "unavailable",
  "cancelled",
]);

// ─── Tables list ──────────────────────────────────────────────────────────────

export const tableStatusSchema = z.enum([
  "available",
  "occupied",
  "awaiting_payment",
  "closed",
]);

export const cashierTableSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  name: z.string(),
  capacity: z.number().int(),
  pos_x: z.number(),
  pos_y: z.number(),
  status: tableStatusSchema,
  current_session_id: z.string().uuid().nullable(),
  // Joined: active session info
  session_status: z.enum(["open", "awaiting_payment", "paid", "cancelled"]).nullable(),
  // Computed: how many non-cart items in this session
  active_item_count: z.number().int(),
  // Computed: order subtotal
  subtotal: z.number().nullable(),
});

export const cashierTablesResponseSchema = z.object({
  tables: z.array(cashierTableSchema),
});

export type CashierTable = z.infer<typeof cashierTableSchema>;
export type TableStatus = z.infer<typeof tableStatusSchema>;

// ─── Table detail ─────────────────────────────────────────────────────────────

export const cashierOrderItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  menu_item_id: z.string().uuid().nullable(),
  name_snapshot: z.string(),
  price_snapshot: z.number(),
  qty: z.number().int(),
  notes: z.string().nullable(),
  status: orderItemStatusSchema,
  area: z.enum(["cocina", "barra"]),
  added_by_staff_id: z.string().uuid().nullable(),
  created_at: z.string(),
  accepted_at: z.string().nullable(),
  ready_at: z.string().nullable(),
  delivered_at: z.string().nullable(),
});

export const cashierOrderSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  subtotal: z.number(),
  tip: z.number(),
  total: z.number(),
  items: z.array(cashierOrderItemSchema),
});

export const cashierSessionSchema = z.object({
  id: z.string().uuid(),
  table_id: z.string().uuid(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
  status: z.enum(["open", "awaiting_payment", "paid", "cancelled"]),
});

export const cashierTableDetailSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  name: z.string(),
  capacity: z.number().int(),
  status: tableStatusSchema,
  current_session_id: z.string().uuid().nullable(),
  session: cashierSessionSchema.nullable(),
  order: cashierOrderSchema.nullable(),
});

export const cashierTableDetailResponseSchema = z.object({
  table: cashierTableDetailSchema,
});

export type CashierOrderItem = z.infer<typeof cashierOrderItemSchema>;
export type CashierTableDetail = z.infer<typeof cashierTableDetailSchema>;
export type CashierOrder = z.infer<typeof cashierOrderSchema>;

// ─── Add item manually ────────────────────────────────────────────────────────

export const addTableItemBodySchema = z.object({
  menuItemId: z.string().uuid("El ítem de menú no es válido."),
  qty: z.number().int().min(1).max(99),
  notes: z.string().max(200).optional(),
});

export type AddTableItemInput = z.infer<typeof addTableItemBodySchema>;

// ─── Update order item ────────────────────────────────────────────────────────

export const updateOrderItemBodySchema = z.object({
  qty: z.number().int().min(1).max(99).optional(),
  notes: z.string().max(200).nullable().optional(),
  status: z.enum(["cancelled"]).optional(),
  reason: z.string().max(500).optional(),
});

export type UpdateOrderItemInput = z.infer<typeof updateOrderItemBodySchema>;

// ─── Close / mark-paid / reset (no body needed) ──────────────────────────────

export const emptyBodySchema = z.object({}).strict();
