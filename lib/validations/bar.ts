import { z } from "zod";

export const emptyBarQuerySchema = z.object({}).strict();

export const barPatchStatusSchema = z.enum([
  "in_progress",
  "ready",
  "delivered",
  "unavailable",
]);

export const barItemStatusSchema = z.enum([
  "pending",
  "in_progress",
  "ready",
  "delivered",
  "unavailable",
]);

const barTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  number: z.number().int(),
});

const barOrderSchema = z
  .object({
    table_sessions: z
      .object({
        table: barTableSchema.nullable(),
      })
      .nullable(),
  })
  .nullable();

export const barItemSchema = z.object({
  accepted_at: z.string().nullable(),
  added_by_staff_id: z.string().uuid().nullable(),
  area: z.literal("barra"),
  created_at: z.string(),
  delivered_at: z.string().nullable(),
  id: z.string().uuid(),
  menu_item_id: z.string().uuid().nullable(),
  name_snapshot: z.string(),
  notes: z.string().nullable(),
  order_id: z.string().uuid(),
  orders: barOrderSchema,
  price_snapshot: z.number(),
  qty: z.number().int(),
  ready_at: z.string().nullable(),
  status: barItemStatusSchema,
});

export const barItemsResponseSchema = z.object({
  items: z.array(barItemSchema),
});

export const updateBarItemBodySchema = z.object({
  id: z.string().uuid("El ítem no es válido."),
  status: barPatchStatusSchema,
});

export const updateBarItemResponseSchema = z.object({
  item: barItemSchema,
});

export type BarItem = z.infer<typeof barItemSchema>;
export type BarItemStatus = z.infer<typeof barItemStatusSchema>;
export type UpdateBarItemInput = z.infer<typeof updateBarItemBodySchema>;
