import { z } from "zod";

export const emptyKitchenQuerySchema = z.object({}).strict();

export const kitchenPatchStatusSchema = z.enum([
  "in_progress",
  "ready",
  "delivered",
  "unavailable",
]);

export const kitchenItemStatusSchema = z.enum([
  "pending",
  "in_progress",
  "ready",
  "delivered",
  "unavailable",
]);

const kitchenTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  number: z.number().int(),
});

const kitchenOrderSchema = z
  .object({
    table_sessions: z
      .object({
        table: kitchenTableSchema.nullable(),
      })
      .nullable(),
  })
  .nullable();

export const kitchenItemSchema = z.object({
  accepted_at: z.string().nullable(),
  added_by_staff_id: z.string().uuid().nullable(),
  area: z.literal("cocina"),
  created_at: z.string(),
  delivered_at: z.string().nullable(),
  id: z.string().uuid(),
  menu_item_id: z.string().uuid().nullable(),
  name_snapshot: z.string(),
  notes: z.string().nullable(),
  order_id: z.string().uuid(),
  orders: kitchenOrderSchema,
  price_snapshot: z.number(),
  qty: z.number().int(),
  ready_at: z.string().nullable(),
  status: kitchenItemStatusSchema,
});

export const kitchenItemsResponseSchema = z.object({
  items: z.array(kitchenItemSchema),
});

export const updateKitchenItemBodySchema = z.object({
  id: z.string().uuid("El ítem no es válido."),
  status: kitchenPatchStatusSchema,
});

export const updateKitchenItemResponseSchema = z.object({
  item: kitchenItemSchema,
});

export type KitchenItem = z.infer<typeof kitchenItemSchema>;
export type KitchenItemStatus = z.infer<typeof kitchenItemStatusSchema>;
export type UpdateKitchenItemInput = z.infer<typeof updateKitchenItemBodySchema>;
