import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";

import {
  errorResponse,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { getDinerSession } from "@/lib/auth/diner-jwt";
import { getMercadoPagoEnv } from "@/lib/env";
import {
  createMercadoPagoClient,
  getMercadoPagoCheckoutUrl,
} from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  dinerPaymentCheckoutBodySchema,
  dinerPaymentCheckoutResponseSchema,
} from "@/lib/validations/diner";

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export async function POST(request: NextRequest) {
  const dinerSession = await getDinerSession(request);

  if (!dinerSession) {
    return errorResponse("UNAUTHORIZED", "Sesion invalida.", 401);
  }

  const bodyResult = await readJsonBody(request);

  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const parsedBody = dinerPaymentCheckoutBodySchema.safeParse(bodyResult.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();

  try {
    const { data: tableSession, error: sessionError } = await admin
      .from("table_sessions")
      .select("id, table_id, status")
      .eq("id", dinerSession.sessionId)
      .maybeSingle();

    if (sessionError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(sessionError, "No pudimos validar la sesion."),
        500,
      );
    }

    if (!tableSession || tableSession.table_id !== dinerSession.tableId) {
      return errorResponse("NOT_FOUND", "No encontramos la sesion de la mesa.", 404);
    }

    if (tableSession.status !== "awaiting_payment") {
      return errorResponse(
        "CONFLICT",
        "La mesa todavia no esta lista para pagar.",
        409,
      );
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id")
      .eq("session_id", tableSession.id)
      .maybeSingle();

    if (orderError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(orderError, "No pudimos cargar la orden."),
        500,
      );
    }

    if (!order) {
      return errorResponse("NOT_FOUND", "No encontramos la orden de la mesa.", 404);
    }

    const { data: table, error: tableError } = await admin
      .from("tables")
      .select("id, number, name")
      .eq("id", tableSession.table_id)
      .maybeSingle();

    if (tableError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(tableError, "No pudimos cargar los datos de la mesa."),
        500,
      );
    }

    if (!table) {
      return errorResponse("NOT_FOUND", "No encontramos la mesa.", 404);
    }

    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select("qty, price_snapshot, status")
      .eq("order_id", order.id);

    if (itemsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(itemsError, "No pudimos recalcular el total."),
        500,
      );
    }

    const subtotal = roundCurrency(
      items.reduce((accumulator, item) => {
        if (
          item.status === "cart" ||
          item.status === "cancelled" ||
          item.status === "unavailable"
        ) {
          return accumulator;
        }

        return accumulator + item.qty * item.price_snapshot;
      }, 0),
    );

    const tipAmount = roundCurrency((subtotal * parsedBody.data.tip) / 100);
    const total = roundCurrency(subtotal + tipAmount);

    if (total <= 0) {
      return errorResponse(
        "CONFLICT",
        "No hay un total valido para enviar a Mercado Pago.",
        409,
      );
    }

    const { NEXT_PUBLIC_APP_URL } = getMercadoPagoEnv();
    const successUrl = new URL(`/t/${table.id}/done`, NEXT_PUBLIC_APP_URL).toString();
    const pendingUrl = new URL(
      `/t/${table.id}/pay?status=pending`,
      NEXT_PUBLIC_APP_URL,
    ).toString();
    const failureUrl = new URL(
      `/t/${table.id}/pay?status=failure`,
      NEXT_PUBLIC_APP_URL,
    ).toString();
    const notificationUrl = new URL(
      "/api/webhooks/mercadopago",
      NEXT_PUBLIC_APP_URL,
    ).toString();
    const preferenceClient = new Preference(await createMercadoPagoClient());

    const { error: orderUpdateError } = await admin
      .from("orders")
      .update({
        subtotal,
        tip: tipAmount,
        total,
      })
      .eq("id", order.id);

    if (orderUpdateError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(orderUpdateError, "No pudimos preparar el pago."),
        500,
      );
    }

    const { data: paymentRecord, error: paymentInsertError } = await admin
      .from("payments")
      .insert({
        session_id: tableSession.id,
        provider: "mercadopago",
        amount: total,
        status: "pending",
        raw_payload: {
          order_id: order.id,
          tip_percentage: parsedBody.data.tip,
          table_id: table.id,
        },
      })
      .select("id")
      .single();

    if (paymentInsertError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(paymentInsertError, "No pudimos registrar el intento de pago."),
        500,
      );
    }

    const preferencePayload = {
      auto_return: successUrl.startsWith("https") ? ("approved" as const) : undefined,
      back_urls: {
        failure: failureUrl,
        pending: pendingUrl,
        success: successUrl,
      },
      external_reference: tableSession.id,
      items: [
        {
          currency_id: "ARS",
          description: table.name,
          id: order.id,
          quantity: 1,
          title: `Consumo Mesa ${table.number}`,
          unit_price: total,
        },
      ],
      metadata: {
        local_payment_id: paymentRecord.id,
        session_id: tableSession.id,
        table_id: table.id,
      },
      notification_url: notificationUrl,
    };

    try {
      const preference = await preferenceClient.create({
        body: preferencePayload,
      });

      const checkoutUrl = getMercadoPagoCheckoutUrl({
        initPoint: preference.init_point ?? null,
        sandboxInitPoint: preference.sandbox_init_point ?? null,
      });

      if (!checkoutUrl) {
        await admin
          .from("payments")
          .update({
            raw_payload: {
              error: "missing_init_point",
              order_id: order.id,
              preference_id: preference.id,
              tip_percentage: parsedBody.data.tip,
            },
            status: "cancelled",
          })
          .eq("id", paymentRecord.id);

        return errorResponse(
          "INTERNAL",
          "Mercado Pago no devolvio una URL de checkout valida.",
          500,
        );
      }

      await admin
        .from("payments")
        .update({
          raw_payload: {
            checkout_url: checkoutUrl,
            order_id: order.id,
            preference_id: preference.id,
            tip_percentage: parsedBody.data.tip,
          },
        })
        .eq("id", paymentRecord.id);

      return NextResponse.json(
        dinerPaymentCheckoutResponseSchema.parse({
          checkoutUrl,
        }),
      );
    } catch (error) {
      await admin
        .from("payments")
        .update({
          raw_payload: {
            error: getErrorMessage(error, "Mercado Pago rechazo la preferencia."),
            order_id: order.id,
            tip_percentage: parsedBody.data.tip,
          },
          status: "cancelled",
        })
        .eq("id", paymentRecord.id);

      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos iniciar el pago con Mercado Pago."),
        500,
      );
    }
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos preparar el checkout."),
      500,
    );
  }
}
