import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import {
  createMercadoPagoClient,
  type MercadoPagoWebhookPayload,
  validateMercadoPagoWebhookSignature,
} from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMercadoPagoEnv } from "@/lib/env";

function mapMercadoPagoStatus(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "approved" as const;
    case "rejected":
      return "rejected" as const;
    case "cancelled":
      return "cancelled" as const;
    default:
      return "pending" as const;
  }
}

function toRawPayload(value: unknown): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(value)) as unknown;

  if (typeof normalized === "object" && normalized !== null && !Array.isArray(normalized)) {
    return normalized as Record<string, unknown>;
  }

  return {};
}

export async function POST(request: NextRequest) {
  const { MP_WEBHOOK_SECRET } = getMercadoPagoEnv();

  if (!MP_WEBHOOK_SECRET) {
    return errorResponse(
      "INTERNAL",
      "Falta configurar el secreto del webhook de Mercado Pago.",
      500,
    );
  }

  let payload: MercadoPagoWebhookPayload = {};

  try {
    payload = (await request.json()) as MercadoPagoWebhookPayload;
  } catch {
    return errorResponse("INVALID_INPUT", "El payload del webhook es inválido.", 400);
  }

  const fallbackPaymentId = request.nextUrl.searchParams.get("data.id");
  const normalizedPayload: MercadoPagoWebhookPayload = {
    ...payload,
    data: {
      id: payload.data?.id ?? fallbackPaymentId,
    },
  };

  const isValidSignature = validateMercadoPagoWebhookSignature({
    payload: normalizedPayload,
    requestIdHeader: request.headers.get("x-request-id"),
    secret: MP_WEBHOOK_SECRET,
    signatureHeader: request.headers.get("x-signature"),
  });

  if (!isValidSignature) {
    return errorResponse("UNAUTHORIZED", "La firma del webhook es inválida.", 401);
  }

  const paymentId = normalizedPayload.data?.id;

  if (!paymentId) {
    return errorResponse("INVALID_INPUT", "No recibimos el ID del pago.", 400);
  }

  const admin = supabaseAdmin();
  const paymentClient = new Payment(createMercadoPagoClient());

  try {
    const payment = await paymentClient.get({ id: paymentId });
    const sessionId =
      typeof payment.external_reference === "string"
        ? payment.external_reference
        : null;

    if (!sessionId) {
      return errorResponse(
        "NOT_FOUND",
        "El pago de Mercado Pago no tiene una referencia de sesión válida.",
        404,
      );
    }

    const { data: existingApprovedPayment, error: approvedLookupError } = await admin
      .from("payments")
      .select("id")
      .eq("session_id", sessionId)
      .eq("provider", "mercadopago")
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (approvedLookupError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(approvedLookupError, "No pudimos validar la idempotencia del pago."),
        500,
      );
    }

    if (existingApprovedPayment) {
      return NextResponse.json({ received: true, duplicated: true });
    }

    const paymentStatus = mapMercadoPagoStatus(payment.status);
    const amount =
      typeof payment.transaction_amount === "number" ? payment.transaction_amount : 0;
    const externalId = String(payment.id);
    const rawPayload = toRawPayload(payment);

    const { data: localPayment, error: localPaymentError } = await admin
      .from("payments")
      .select("id")
      .eq("session_id", sessionId)
      .eq("provider", "mercadopago")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (localPaymentError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(localPaymentError, "No pudimos actualizar el pago local."),
        500,
      );
    }

    if (localPayment) {
      const { error: updatePaymentError } = await admin
        .from("payments")
        .update({
          amount,
          external_id: externalId,
          raw_payload: rawPayload,
          status: paymentStatus,
        })
        .eq("id", localPayment.id);

      if (updatePaymentError) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(updatePaymentError, "No pudimos guardar el estado del pago."),
          500,
        );
      }
    } else {
      const { error: insertPaymentError } = await admin.from("payments").insert({
        amount,
        external_id: externalId,
        provider: "mercadopago",
        raw_payload: rawPayload,
        session_id: sessionId,
        status: paymentStatus,
      });

      if (insertPaymentError) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(insertPaymentError, "No pudimos registrar el pago."),
          500,
        );
      }
    }

    if (paymentStatus === "approved") {
      const { data: tableSession, error: sessionLookupError } = await admin
        .from("table_sessions")
        .select("id, table_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionLookupError) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(sessionLookupError, "No pudimos cerrar la sesión pagada."),
          500,
        );
      }

      if (!tableSession) {
        return errorResponse("NOT_FOUND", "La sesión del pago no existe.", 404);
      }

      const closedAt = new Date().toISOString();

      const { error: sessionUpdateError } = await admin
        .from("table_sessions")
        .update({
          closed_at: closedAt,
          status: "paid",
        })
        .eq("id", tableSession.id);

      if (sessionUpdateError) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(sessionUpdateError, "No pudimos cerrar la sesión pagada."),
          500,
        );
      }

      const { error: tableUpdateError } = await admin
        .from("tables")
        .update({
          status: "closed",
        })
        .eq("id", tableSession.table_id);

      if (tableUpdateError) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(tableUpdateError, "No pudimos actualizar la mesa pagada."),
          500,
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos procesar el webhook de Mercado Pago."),
      500,
    );
  }
}
