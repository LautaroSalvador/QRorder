import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { getDinerSession } from "@/lib/auth/diner-jwt";
import { getDinerOrderContext } from "@/lib/diner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dinerPaymentStatusResponseSchema } from "@/lib/validations/diner";

export async function GET(request: NextRequest) {
  const session = await getDinerSession(request);

  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sesion invalida.", 401);
  }

  try {
    const context = await getDinerOrderContext(session.sessionId, session.tableId, [
      "open",
      "awaiting_payment",
      "paid",
    ]);

    if (!context) {
      return errorResponse(
        "NOT_FOUND",
        "No encontramos una orden activa para esta mesa.",
        404,
      );
    }

    const admin = supabaseAdmin();
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, amount, created_at, external_id, provider, status")
      .eq("session_id", context.tableSession.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(paymentError, "No pudimos cargar el estado del pago."),
        500,
      );
    }

    return NextResponse.json(
      dinerPaymentStatusResponseSchema.parse({
        orderTotal: context.order.total,
        payment: payment
          ? {
              id: payment.id,
              amount: payment.amount,
              createdAt: payment.created_at,
              externalId: payment.external_id,
              provider: payment.provider,
              status: payment.status,
            }
          : null,
        sessionStatus: context.tableSession.status,
      }),
    );
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar el estado del pago."),
      500,
    );
  }
}
