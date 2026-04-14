import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña es demasiado larga."),
  next: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value && value.startsWith("/") && !value.startsWith("//")
        ? value
        : "/staff/cashier",
    ),
});
