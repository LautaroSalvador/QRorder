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

  // Verify session is open
  const { data: session, error: sessionError } = await admin
    .from("table_sessions")
    .select("id, status")
    .eq("id", table.current_session_id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("INTERNAL", getErrorMessage(sessionError, "Error al buscar la sesión."), 500);
  }
  if (!session || session.status !== "open") {
    return errorResponse("CONFLICT", "La sesión no está abierta.", 409);
  }

  // Recalculate subtotal from confirmed items
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();

  if (orderError) {
    return errorResponse("INTERNAL", getErrorMessage(orderError, "Error al buscar la orden."), 500);
  }

  if (order) {
    const { data: items } = await admin
      .from("order_items")
      .select("qty, price_snapshot, status")
      .eq("order_id", order.id)
      .not("status", "in", '("cart","cancelled","unavailable")');

    const subtotal = (items ?? []).reduce(
      (sum, item) => sum + item.price_snapshot * item.qty,
      0,
    );

    await admin.from("orders").update({ subtotal, total: subtotal }).eq("id", order.id);
  }

  // Close the session — mark as awaiting_payment
  const { error: sessionUpdateError } = await admin
    .from("table_sessions")
    .update({ status: "awaiting_payment" })
    .eq("id", session.id);

  if (sessionUpdateError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(sessionUpdateError, "Error al cerrar la sesión."),
      500,
    );
  }

  // Update table status
  await admin
    .from("tables")
    .update({ status: "awaiting_payment" })
    .eq("id", tableId);

  // Audit
  await admin.from("audit_log").insert({
    actor_type: "staff",
    actor_id: auth.session.profile.id,
    action: "close_table",
    entity: "table_sessions",
    entity_id: session.id,
    payload: { table_id: tableId },
  });

  return NextResponse.json({ ok: true });
}
