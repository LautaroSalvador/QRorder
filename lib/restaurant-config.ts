import "server-only";

import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_TIP_OPTIONS = [0, 10, 15] as const;

const soundSettingsSchema = z.object({
  barNotificationsEnabled: z.boolean().optional(),
  kitchenNotificationsEnabled: z.boolean().optional(),
});

const tipOptionsSchema = z
  .array(
    z.coerce
      .number()
      .int("Las propinas sugeridas deben ser enteras.")
      .min(0, "La propina sugerida no puede ser negativa.")
      .max(100, "La propina sugerida no puede superar el 100%."),
  )
  .min(1, "Ingresa al menos una propina sugerida.")
  .max(5, "Solo puedes guardar hasta 5 sugerencias.");

function normalizeTipOptions(value: unknown) {
  const parsed = tipOptionsSchema.safeParse(value);

  if (!parsed.success) {
    return [...DEFAULT_TIP_OPTIONS];
  }

  const uniqueValues = [...new Set(parsed.data)].sort((left, right) => left - right);

  return uniqueValues.length > 0 ? uniqueValues : [...DEFAULT_TIP_OPTIONS];
}

function normalizeSoundSettings(value: unknown) {
  const parsed = soundSettingsSchema.safeParse(value);

  return {
    barNotificationsEnabled: parsed.success
      ? (parsed.data.barNotificationsEnabled ?? false)
      : false,
    kitchenNotificationsEnabled: parsed.success
      ? (parsed.data.kitchenNotificationsEnabled ?? false)
      : false,
  };
}

export async function getRestaurantConfigSnapshot() {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("restaurant_config")
    .select("name, mp_access_token, mp_public_key, settings, tip_options")
    .eq("id", 1)
    .maybeSingle();

  return {
    hasAccessToken: Boolean(data?.mp_access_token),
    hasPublicKey: Boolean(data?.mp_public_key),
    name: data?.name?.trim() || "MesaQR",
    soundSettings: normalizeSoundSettings(data?.settings),
    tipOptions: normalizeTipOptions(data?.tip_options),
  };
}

export { DEFAULT_TIP_OPTIONS, normalizeSoundSettings, normalizeTipOptions };
