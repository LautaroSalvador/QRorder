import { z } from "zod";

import { staffRoleSchema } from "@/lib/staff";

export const preparationAreaSchema = z.enum(["cocina", "barra"]);

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sort_order: z.number().int().min(0),
  preparation_area: preparationAreaSchema,
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre."),
  preparationArea: preparationAreaSchema,
  sortOrder: z.coerce
    .number()
    .int("El orden debe ser un número entero.")
    .min(0, "El orden no puede ser negativo."),
});

export const updateCategorySchema = createCategorySchema;

export const menuItemCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  preparation_area: preparationAreaSchema,
});

export const menuItemSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  price: z.coerce.number().nonnegative(),
  image_url: z.string().url().nullable(),
  available: z.boolean(),
  sort_order: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
  category: menuItemCategorySchema.nullable(),
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre."),
  description: z.string().trim().min(1, "Ingresá una descripción."),
  price: z.coerce
    .number()
    .positive("El precio debe ser mayor a cero.")
    .max(999999, "El precio es demasiado alto."),
  categoryId: z.string().uuid("Seleccioná una categoría válida."),
  available: z.boolean(),
});

export const updateMenuItemSchema = createMenuItemSchema;

export const tableSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  status: z.enum(["available", "occupied", "awaiting_payment", "closed"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createTableSchema = z.object({
  number: z.coerce
    .number()
    .int("El número debe ser entero.")
    .positive("El número debe ser mayor a cero."),
  name: z.string().trim().min(1, "Ingresá un nombre."),
  capacity: z.coerce
    .number()
    .int("La capacidad debe ser entera.")
    .positive("La capacidad debe ser mayor a cero.")
    .max(50, "La capacidad es demasiado alta."),
});

export const updateTableSchema = createTableSchema;

export const staffUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: staffRoleSchema,
  active: z.boolean(),
  created_at: z.string(),
  invited_at: z.string().nullable(),
  last_sign_in_at: z.string().nullable(),
});

export const createStaffUserSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  fullName: z.string().trim().min(1, "Ingresá un nombre."),
  role: staffRoleSchema,
});

export const updateStaffUserSchema = z.object({
  role: staffRoleSchema,
  active: z.boolean(),
});

export const recordIdParamsSchema = z.object({
  id: z.string().uuid("El identificador no es válido."),
});

export const emptyQuerySchema = z.object({});
