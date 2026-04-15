import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Params = { params: Promise<{ tableId: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireStaffApiSession(["cajero", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const { tableId } = await params;
  const admin = supabaseAdmin();

  // Verify table
  const { data: table, error: tableError } = await admin
    .from("tables")
    .select("id, status, current_session_id")
    .eq("id", tableId)
    .maybeSingle();

  if (tableError) {
    return errorResponse("INTERNAL", getErrorMessage(tableError, "Error al buscar la mesa."), 500);
  }
  if (!table) {
    return errorResponse("NOT_FOUND", "Mesa no encontrada.", 404);
  }
  if (!table.current_session_id) {
    return errorResponse("CONFLICT", "La mesa no tiene una sesión activa.", 409);
  }

  // Verify session is awaiting_payment
  const { data: session, error: sessionError } = await admin
    .from("table_sessions")
    .select("id, status")
    .eq("id", table.current_session_id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("INTERNAL", getErrorMessage(sessionError, "Error al buscar la sesión."), 500);
  }
  if (!session || session.status !== "awaiting_payment") {
    return errorResponse(
      "CONFLICT",
      "La mesa debe estar en estado 'esperando pago' para marcarla como pagada.",
      409,
    );
  }

  // Fetch order total for the payment record
  const { data: order } = await admin
    .from("orders")
    .select("id, total")
    .eq("session_id", session.id)
    .maybeSingle();

  const amount = order?.total ?? 0;

  // Create offline payment record
  const { error: paymentError } = await admin.from("payments").insert({
    session_id: session.id,
    provider: "offline",
    amount,
    status: "approved",
    raw_payload: { method: "offline", cashier_id: auth.session.profile.id },
  });

  if (paymentError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(paymentError, "Error al registrar el pago."),
      500,
    );
  }

  // Mark session as paid
  await admin
    .from("table_sessions")
    .update({ status: "paid", closed_at: new Date().toISOString() })
    .eq("id", session.id);

  // Mark table as closed
  await admin.from("tables").update({ status: "closed" }).eq("id", tableId);

  // Audit
  await admin.from("audit_log").insert({
    actor_type: "staff",
    actor_id: auth.session.profile.id,
    action: "mark_paid_offline",
    entity: "table_sessions",
    entity_id: session.id,
    payload: { table_id: tableId, amount },
  });

  return NextResponse.json({ ok: true });
}
