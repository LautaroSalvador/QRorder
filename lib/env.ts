import { z } from "zod";

const supabaseClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const supabaseAdminEnvSchema = supabaseClientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const dinerJwtEnvSchema = z.object({
  DINER_JWT_SECRET: z.string().min(32),
});

const cryptoEnvSchema = z.object({
  CONFIG_ENCRYPTION_KEY: z.string().min(32),
});

const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  MP_ACCESS_TOKEN: z.string().min(1).optional(),
  MP_WEBHOOK_SECRET: z.string().min(1).optional(),
  SENTRY_DSN: z.string().optional(),
});

const mercadoPagoEnvSchema = z.object({
  MP_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

function parseEnv<T extends z.ZodTypeAny>(schema: T, label: string): z.infer<T> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`${label} inválido: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function getSupabaseClientEnv() {
  return parseEnv(supabaseClientEnvSchema, "Entorno público de Supabase");
}

export function getSupabaseAdminEnv() {
  return parseEnv(supabaseAdminEnvSchema, "Entorno admin de Supabase");
}

export function getDinerJwtEnv() {
  return parseEnv(dinerJwtEnvSchema, "Entorno JWT de comensal");
}

export function getCryptoEnv() {
  return parseEnv(cryptoEnvSchema, "Entorno de cifrado");
}

export function getAppEnv() {
  return parseEnv(appEnvSchema, "Entorno de aplicación");
}

export function getMercadoPagoEnv() {
  return parseEnv(mercadoPagoEnvSchema, "Entorno de Mercado Pago");
}
