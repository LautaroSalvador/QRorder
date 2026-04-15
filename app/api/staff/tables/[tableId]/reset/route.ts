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
    return errorResponse("CONFLICT", "La mesa no tiene sesión activa que resetear.", 409);
  }

  // Verify session is paid or cancelled (not open/awaiting_payment)
  const { data: session, error: sessionError } = await admin
    .from("table_sessions")
    .select("id, status")
    .eq("id", table.current_session_id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("INTERNAL", getErrorMessage(sessionError, "Error al buscar la sesión."), 500);
  }
  if (!session) {
    return errorResponse("NOT_FOUND", "Sesión no encontrada.", 404);
  }
  if (session.status !== "paid" && session.status !== "cancelled") {
    return errorResponse(
      "CONFLICT",
      "Solo se puede resetear una mesa cuya sesión esté pagada o cancelada.",
      409,
    );
  }

  // Detach the session from the table and mark table as available
  const { error: resetError } = await admin
    .from("tables")
    .update({ status: "available", current_session_id: null })
    .eq("id", tableId);

  if (resetError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(resetError, "Error al resetear la mesa."),
      500,
    );
  }

  // Audit
  await admin.from("audit_log").insert({
    actor_type: "staff",
    actor_id: auth.session.profile.id,
    action: "reset_table",
    entity: "tables",
    entity_id: tableId,
    payload: { session_id: session.id },
  });

  return NextResponse.json({ ok: true });
}
