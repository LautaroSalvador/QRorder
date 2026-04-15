import { z } from "zod";

export const dinerTableParamsSchema = z.object({
  tableId: z.string().uuid("La mesa no es válida."),
});

export const dinerSessionBodySchema = z.object({
  tableId: z.string().uuid("La mesa no es válida."),
});

export const dinerOrderItemBodySchema = z.object({
  menuItemId: z.string().uuid("El ítem no es válido."),
  qty: z.coerce
    .number()
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad mínima es 1.")
    .max(99, "La cantidad máxima es 99."),
  notes: z
    .string()
    .trim()
    .max(200, "Las aclaraciones no pueden superar los 200 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const dinerOrderItemUpdateBodySchema = z.object({
  qty: z.coerce
    .number()
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad mínima es 1.")
    .max(99, "La cantidad máxima es 99."),
  notes: z
    .string()
    .trim()
    .max(200, "Las aclaraciones no pueden superar los 200 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const dinerItemParamsSchema = z.object({
  itemId: z.string().uuid("El ítem no es válido."),
});

export const dinerPaymentCheckoutBodySchema = z.object({
  tip: z.coerce
    .number()
    .min(0, "La propina no puede ser negativa.")
    .max(100, "La propina no puede superar el 100%."),
});

export const dinerPaymentCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

export const dinerMenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string().url().nullable(),
});

export const dinerMenuCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  preparationArea: z.enum(["cocina", "barra"]),
  items: z.array(dinerMenuItemSchema),
});

export const dinerTableSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  name: z.string(),
  status: z.enum(["available", "occupied", "awaiting_payment", "closed"]),
});

export const dinerSessionResponseSchema = z.object({
  orderId: z.string().uuid(),
  resumed: z.boolean(),
  sessionId: z.string().uuid(),
  table: dinerTableSchema,
});

export const dinerOrderItemSchema = z.object({
  id: z.string().uuid(),
  area: z.enum(["cocina", "barra"]),
  createdAt: z.string(),
  menuItemId: z.string().uuid().nullable(),
  nameSnapshot: z.string(),
  notes: z.string().nullable(),
  priceSnapshot: z.number(),
  qty: z.number().int(),
  status: z.enum([
    "cart",
    "pending",
    "accepted",
    "in_progress",
    "ready",
    "delivered",
    "unavailable",
    "cancelled",
  ]),
});

export const dinerOrderResponseSchema = z.object({
  orderId: z.string().uuid(),
  sessionId: z.string().uuid(),
  sessionStatus: z.enum(["open", "awaiting_payment", "paid", "cancelled"]),
  subtotal: z.number(),
  tip: z.number(),
  total: z.number(),
  items: z.array(dinerOrderItemSchema),
  table: dinerTableSchema,
});

export type DinerMenuCategory = z.infer<typeof dinerMenuCategorySchema>;
export type DinerOrderResponse = z.infer<typeof dinerOrderResponseSchema>;
export type DinerPaymentCheckoutResponse = z.infer<
  typeof dinerPaymentCheckoutResponseSchema
>;
