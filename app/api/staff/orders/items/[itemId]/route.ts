import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { updateOrderItemBodySchema } from "@/lib/validations/cashier";

type Params = { params: Promise<{ itemId: string }> };

// Statuses that require a reason when modifying/cancelling
const ACCEPTED_STATUSES = ["accepted", "in_progress", "ready", "delivered"] as const;
type AcceptedStatus = typeof ACCEPTED_STATUSES[number];

function isAccepted(status: string): status is AcceptedStatus {
  return (ACCEPTED_STATUSES as readonly string[]).includes(status);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApiSession(["cajero", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const { itemId } = await params;

  const jsonBody = await readJsonBody(request);
  if ("response" in jsonBody) return jsonBody.response;

  const parsed = updateOrderItemBodySchema.safeParse(jsonBody.data);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.message, 400);
  }

  const { qty, notes, status, reason } = parsed.data;

  // At least one field must be provided
  if (qty === undefined && notes === undefined && status === undefined) {
    return errorResponse("INVALID_INPUT", "No se proporcionaron cambios.", 400);
  }

  const admin = supabaseAdmin();

  // Fetch the item
  const { data: item, error: itemError } = await admin
    .from("order_items")
    .select("id, order_id, status, price_snapshot, qty")
    .eq("id", itemId)
    .maybeSingle();

  if (itemError) {
    return errorResponse("INTERNAL", getErrorMessage(itemError, "Error al buscar el ítem."), 500);
  }
  if (!item) {
    return errorResponse("NOT_FOUND", "Ítem no encontrado.", 404);
  }
  if (item.status === "cancelled") {
    return errorResponse("CONFLICT", "El ítem ya está cancelado.", 409);
  }

  // If item was already accepted by kitchen/bar, require a reason
  if (isAccepted(item.status) && !reason) {
    return errorResponse(
      "INVALID_INPUT",
      "Se requiere un motivo para modificar ítems ya aceptados por cocina/barra.",
      400,
    );
  }

  const prevStatus = item.status;

  // Build update payload
  const updatePayload: Database["public"]["Tables"]["order_items"]["Update"] = {};
  if (qty !== undefined) updatePayload.qty = qty;
  if (notes !== undefined) updatePayload.notes = notes;
  if (status !== undefined) updatePayload.status = status;

  const { error: updateError } = await admin
    .from("order_items")
    .update(updatePayload)
    .eq("id", itemId);

  if (updateError) {
    return errorResponse("INTERNAL", getErrorMessage(updateError, "Error al actualizar el ítem."), 500);
  }

  // If status changed to cancelled, register in order_item_events + audit_log
  if (status === "cancelled") {
    await admin.from("order_item_events").insert({
      order_item_id: itemId,
      from_status: prevStatus,
      to_status: "cancelled",
      actor_type: "staff",
      actor_id: auth.session.profile.id,
      reason: reason ?? null,
    });

    await admin.from("audit_log").insert({
      actor_type: "staff",
      actor_id: auth.session.profile.id,
      action: "cancel_order_item",
      entity: "order_items",
      entity_id: itemId,
      payload: { prev_status: prevStatus, reason: reason ?? null },
    });
  } else if (reason) {
    // Staff modified an accepted item — log it
    await admin.from("audit_log").insert({
      actor_type: "staff",
      actor_id: auth.session.profile.id,
      action: "modify_order_item",
      entity: "order_items",
      entity_id: itemId,
      payload: { prev_status: prevStatus, changes: updatePayload, reason },
    });
  }

  // Recalculate order subtotal
  const { data: allItems } = await admin
    .from("order_items")
    .select("qty, price_snapshot, status")
    .eq("order_id", item.order_id)
    .not("status", "in", '("cart","cancelled","unavailable")');

  const subtotal = (allItems ?? []).reduce(
    (sum, i) => sum + i.price_snapshot * i.qty,
    0,
  );

  await admin.from("orders").update({ subtotal, total: subtotal }).eq("id", item.order_id);

  return NextResponse.json({ ok: true });
}
