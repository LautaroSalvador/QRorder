import { z } from "zod";

export const staffRoleSchema = z.enum(["admin", "cajero", "cocina", "barra"]);

export type StaffRole = z.infer<typeof staffRoleSchema>;
