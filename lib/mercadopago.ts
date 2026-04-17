import { createHmac, timingSafeEqual } from "node:crypto";

import { MercadoPagoConfig } from "mercadopago";

import { decryptText } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type MercadoPagoWebhookPayload = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number | null;
  };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

type SignatureParts = {
  ts: string;
  v1: string;
};

type RestaurantConfigRow =
  Database["public"]["Tables"]["restaurant_config"]["Row"];

function parseSignatureHeader(signatureHeader: string | null): SignatureParts | null {
  if (!signatureHeader) {
    return null;
  }

  const pairs = signatureHeader.split(",").map((part) => part.trim());
  const values = new Map<string, string>();

  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    const value = rest.join("=").trim();

    if (!key || !value) {
      continue;
    }

    values.set(key, value);
  }

  const ts = values.get("ts");
  const v1 = values.get("v1");

  if (!ts || !v1) {
    return null;
  }

  return { ts, v1 };
}

export async function createMercadoPagoClient() {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("restaurant_config")
    .select("mp_access_token")
    .eq("id", 1)
    .maybeSingle();

  const config: Pick<RestaurantConfigRow, "mp_access_token"> | null = data;

  if (!config?.mp_access_token) {
    throw new Error("El restaurante no configuro Mercado Pago todavia.");
  }

  const accessToken = decryptText(config.mp_access_token);

  return new MercadoPagoConfig({
    accessToken,
  });
}

export function getMercadoPagoCheckoutUrl(input: {
  initPoint?: string | null;
  sandboxInitPoint?: string | null;
}) {
  if (process.env.NODE_ENV !== "production" && input.sandboxInitPoint) {
    return input.sandboxInitPoint;
  }

  return input.initPoint ?? input.sandboxInitPoint ?? null;
}

export function validateMercadoPagoWebhookSignature(input: {
  payload: MercadoPagoWebhookPayload;
  signatureHeader: string | null;
  requestIdHeader: string | null;
  secret: string;
}) {
  const parts = parseSignatureHeader(input.signatureHeader);
  const dataId = String(input.payload.data?.id ?? "").toLowerCase();
  const requestId = input.requestIdHeader?.trim() ?? "";

  if (!parts || !dataId || !requestId) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const digest = createHmac("sha256", input.secret).update(manifest).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(parts.v1.toLowerCase(), "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

export type { MercadoPagoWebhookPayload };
