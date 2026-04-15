import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cashierTableDetailResponseSchema } from "@/lib/validations/cashier";

type Params = { params: Promise<{ tableId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireStaffApiSession(["cajero", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const { tableId } = await params;
  const admin = supabaseAdmin();

  // Fetch the table
  const { data: table, error: tableError } = await admin
    .from("tables")
    .select("id, number, name, capacity, status, current_session_id")
    .eq("id", tableId)
    .maybeSingle();

  if (tableError) {
    return errorResponse("INTERNAL", getErrorMessage(tableError, "No pudimos cargar la mesa."), 500);
  }
  if (!table) {
    return errorResponse("NOT_FOUND", "Mesa no encontrada.", 404);
  }

  // No active session
  if (!table.current_session_id) {
    const result = {
      table: { ...table, session: null, order: null },
    };
    const parsed = cashierTableDetailResponseSchema.safeParse(result);
    if (!parsed.success) {
      return errorResponse("INTERNAL", "No pudimos interpretar la mesa.", 500);
    }
    return NextResponse.json(parsed.data);
  }

  // Fetch active session
  const { data: session, error: sessionError } = await admin
    .from("table_sessions")
    .select("id, table_id, opened_at, closed_at, status")
    .eq("id", table.current_session_id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("INTERNAL", getErrorMessage(sessionError, "No pudimos cargar la sesión."), 500);
  }

  if (!session) {
    const result = { table: { ...table, session: null, order: null } };
    const parsed = cashierTableDetailResponseSchema.safeParse(result);
    if (!parsed.success) return errorResponse("INTERNAL", "No pudimos interpretar la mesa.", 500);
    return NextResponse.json(parsed.data);
  }

  // Fetch order for this session
  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .select("id, session_id, subtotal, tip, total")
    .eq("session_id", session.id)
    .maybeSingle();

  if (orderError) {
    return errorResponse("INTERNAL", getErrorMessage(orderError, "No pudimos cargar la orden."), 500);
  }

  let orderWithItems = null;

  if (orderRow) {
    // Fetch items separately — excluding cart-only items
    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select(
        "id, order_id, menu_item_id, name_snapshot, price_snapshot, qty, notes, status, area, added_by_staff_id, created_at, accepted_at, ready_at, delivered_at",
      )
      .eq("order_id", orderRow.id)
      .not("status", "eq", "cart")
      .order("created_at", { ascending: true });

    if (itemsError) {
      return errorResponse("INTERNAL", getErrorMessage(itemsError, "No pudimos cargar los ítems."), 500);
    }

    orderWithItems = {
      id: orderRow.id,
      session_id: orderRow.session_id,
      subtotal: orderRow.subtotal,
      tip: orderRow.tip,
      total: orderRow.total,
      items: items ?? [],
    };
  }

  const result = {
    table: {
      ...table,
      session,
      order: orderWithItems,
    },
  };

  const parsed = cashierTableDetailResponseSchema.safeParse(result);
  if (!parsed.success) {
    return errorResponse("INTERNAL", "No pudimos interpretar el detalle de la mesa.", 500);
  }

  return NextResponse.json(parsed.data);
}
