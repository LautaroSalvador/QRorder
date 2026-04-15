import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addTableItemBodySchema } from "@/lib/validations/cashier";

type Params = { params: Promise<{ tableId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireStaffApiSession(["cajero", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const { tableId } = await params;
  const jsonBody = await readJsonBody(request);
  if ("response" in jsonBody) return jsonBody.response;

  const parsedBody = addTableItemBodySchema.safeParse(jsonBody.data);
  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const { menuItemId, qty, notes } = parsedBody.data;
  const admin = supabaseAdmin();

  // Verify table has an open session
  const { data: table, error: tableError } = await admin
    .from("tables")
    .select("id, current_session_id")
    .eq("id", tableId)
    .maybeSingle();

  if (tableError) {
    return errorResponse("INTERNAL", getErrorMessage(tableError, "Error al buscar la mesa."), 500);
  }
  if (!table) return errorResponse("NOT_FOUND", "Mesa no encontrada.", 404);
  if (!table.current_session_id) {
    return errorResponse("CONFLICT", "La mesa no tiene una sesión activa.", 409);
  }

  const { data: session, error: sessionError } = await admin
    .from("table_sessions")
    .select("id, status")
    .eq("id", table.current_session_id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("INTERNAL", getErrorMessage(sessionError, "Error al buscar la sesión."), 500);
  }
  if (!session || session.status !== "open") {
    return errorResponse("CONFLICT", "Solo se pueden agregar ítems a sesiones abiertas.", 409);
  }

  // Fetch menu item
  const { data: menuItem, error: menuItemError } = await admin
    .from("menu_items")
    .select("id, name, price, available, category_id")
    .eq("id", menuItemId)
    .maybeSingle();

  if (menuItemError) {
    return errorResponse("INTERNAL", getErrorMessage(menuItemError, "Error al buscar el ítem."), 500);
  }
  if (!menuItem) return errorResponse("NOT_FOUND", "Ítem de menú no encontrado.", 404);
  if (!menuItem.available) return errorResponse("CONFLICT", "El ítem no está disponible.", 409);

  // Get prep area from category
  const { data: category, error: categoryError } = await admin
    .from("menu_categories")
    .select("preparation_area")
    .eq("id", menuItem.category_id)
    .maybeSingle();

  if (categoryError) {
    return errorResponse("INTERNAL", getErrorMessage(categoryError, "Error al buscar la categoría."), 500);
  }

  const area: "cocina" | "barra" = category?.preparation_area ?? "cocina";

  // Get or create order for session
  const { data: existingOrder, error: orderFetchError } = await admin
    .from("orders")
    .select("id, subtotal")
    .eq("session_id", session.id)
    .maybeSingle();

  if (orderFetchError) {
    return errorResponse("INTERNAL", getErrorMessage(orderFetchError, "Error al buscar la orden."), 500);
  }

  let orderId: string;

  if (!existingOrder) {
    const { data: newOrder, error: newOrderError } = await admin
      .from("orders")
      .insert({ session_id: session.id })
      .select("id")
      .single();

    if (newOrderError ?? !newOrder) {
      return errorResponse("INTERNAL", getErrorMessage(newOrderError, "Error al crear la orden."), 500);
    }
    orderId = newOrder.id;
  } else {
    orderId = existingOrder.id;
  }

  // Insert item directly as pending (bypasses cart — staff decision goes straight to kitchen/bar)
  const { data: newItem, error: insertError } = await admin
    .from("order_items")
    .insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      name_snapshot: menuItem.name,
      price_snapshot: menuItem.price,
      qty,
      notes: notes ?? null,
      status: "pending",
      area,
      added_by_staff_id: auth.session.profile.id,
    })
    .select("id")
    .single();

  if (insertError ?? !newItem) {
    return errorResponse("INTERNAL", getErrorMessage(insertError, "Error al agregar el ítem."), 500);
  }

  // Recalculate subtotal
  const { data: allItems, error: itemsError } = await admin
    .from("order_items")
    .select("qty, price_snapshot")
    .eq("order_id", orderId)
    .not("status", "in", '("cart","cancelled","unavailable")');

  if (itemsError) {
    return errorResponse("INTERNAL", getErrorMessage(itemsError, "Error al recalcular el total."), 500);
  }

  const subtotal = (allItems ?? []).reduce(
    (sum, item) => sum + item.price_snapshot * item.qty,
    0,
  );

  await admin.from("orders").update({ subtotal, total: subtotal }).eq("id", orderId);

  return NextResponse.json({ item: { id: newItem.id } }, { status: 201 });
}
