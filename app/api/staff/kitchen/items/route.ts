import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  emptyKitchenQuerySchema,
  kitchenItemsResponseSchema,
  updateKitchenItemBodySchema,
  updateKitchenItemResponseSchema,
} from "@/lib/validations/kitchen";

const KITCHEN_ITEM_SELECT = `
  accepted_at,
  added_by_staff_id,
  area,
  created_at,
  delivered_at,
  id,
  menu_item_id,
  name_snapshot,
  notes,
  order_id,
  price_snapshot,
  qty,
  ready_at,
  status,
  orders (
    table_sessions (
      table:tables!table_sessions_table_id_fkey (
        id,
        name,
        number
      )
    )
  )
`;

type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

function canTransitionStatus(
  currentStatus: OrderItemRow["status"],
  nextStatus: Database["public"]["Tables"]["order_items"]["Update"]["status"],
) {
  if (currentStatus === "pending") {
    return nextStatus === "in_progress" || nextStatus === "unavailable";
  }

  if (currentStatus === "in_progress") {
    return nextStatus === "ready";
  }

  if (currentStatus === "ready") {
    return nextStatus === "delivered";
  }

  return false;
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffApiSession(["cocina", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedQuery = emptyKitchenQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!parsedQuery.success) {
    return errorResponse("INVALID_INPUT", parsedQuery.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("order_items")
    .select(KITCHEN_ITEM_SELECT)
    .eq("area", "cocina")
    .in("status", ["pending", "in_progress", "ready"])
    .order("created_at", { ascending: true });

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar la cola de cocina."),
      500,
    );
  }

  const parsedItems = kitchenItemsResponseSchema.safeParse({ items: data });

  if (!parsedItems.success) {
    return errorResponse(
      "INTERNAL",
      "No pudimos interpretar la cola de cocina.",
      500,
    );
  }

  return NextResponse.json(parsedItems.data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffApiSession(["cocina", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const jsonBody = await readJsonBody(request);

  if ("response" in jsonBody) {
    return jsonBody.response;
  }

  const parsedBody = updateKitchenItemBodySchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data: existingItem, error: existingItemError } = await admin
    .from("order_items")
    .select("id, area, status")
    .eq("id", parsedBody.data.id)
    .maybeSingle();

  if (existingItemError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(existingItemError, "No pudimos cargar el ítem."),
      500,
    );
  }

  if (!existingItem || existingItem.area !== "cocina") {
    return errorResponse(
      "NOT_FOUND",
      "No encontramos ese ítem de cocina.",
      404,
    );
  }

  if (!canTransitionStatus(existingItem.status, parsedBody.data.status)) {
    return errorResponse(
      "CONFLICT",
      "La transición de estado no está permitida para este ítem.",
      409,
    );
  }

  const timestamp = new Date().toISOString();
  const updatePayload: Database["public"]["Tables"]["order_items"]["Update"] = {
    status: parsedBody.data.status,
  };

  if (parsedBody.data.status === "in_progress") {
    updatePayload.accepted_at = timestamp;
  }

  if (parsedBody.data.status === "ready") {
    updatePayload.ready_at = timestamp;
  }

  if (parsedBody.data.status === "delivered") {
    updatePayload.delivered_at = timestamp;
  }

  const { data: updatedItem, error: updateError } = await admin
    .from("order_items")
    .update(updatePayload)
    .eq("id", existingItem.id)
    .select(KITCHEN_ITEM_SELECT)
    .single();

  if (updateError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(updateError, "No pudimos actualizar el ítem."),
      500,
    );
  }

  const parsedItem = updateKitchenItemResponseSchema.safeParse({ item: updatedItem });

  if (!parsedItem.success) {
    return errorResponse(
      "INTERNAL",
      "No pudimos interpretar el ítem actualizado.",
      500,
    );
  }

  return NextResponse.json(parsedItem.data);
}
