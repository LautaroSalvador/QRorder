import { NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cashierTablesResponseSchema, type CashierTable } from "@/lib/validations/cashier";

export async function GET() {
  const auth = await requireStaffApiSession(["cajero", "admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const admin = supabaseAdmin();

  // Fetch all tables
  const { data: tables, error: tablesError } = await admin
    .from("tables")
    .select("id, number, name, capacity, pos_x, pos_y, status, current_session_id")
    .order("number", { ascending: true });

  if (tablesError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(tablesError, "No pudimos cargar las mesas."),
      500,
    );
  }

  // Collect active session IDs
  const sessionIds = tables
    .map((t) => t.current_session_id)
    .filter((id): id is string => id !== null);

  type SessionSummary = {
    session_id: string;
    session_status: "open" | "awaiting_payment" | "paid" | "cancelled";
    active_item_count: number;
    subtotal: number | null;
  };

  const sessionMap: Record<string, SessionSummary> = {};

  if (sessionIds.length > 0) {
    // Fetch sessions
    const { data: sessions, error: sessionsError } = await admin
      .from("table_sessions")
      .select("id, status")
      .in("id", sessionIds);

    if (sessionsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(sessionsError, "No pudimos cargar los estados de sesión."),
        500,
      );
    }

    // Fetch orders for those sessions
    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id, session_id, subtotal")
      .in("session_id", sessionIds);

    if (ordersError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(ordersError, "No pudimos cargar las órdenes."),
        500,
      );
    }

    // Fetch non-cart, non-cancelled item counts per order
    const orderIds = orders.map((o) => o.id);
    const itemCounts: Record<string, number> = {};

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await admin
        .from("order_items")
        .select("order_id, status")
        .in("order_id", orderIds)
        .not("status", "in", '("cart","cancelled")');

      if (itemsError) {
        return errorResponse("INTERNAL", getErrorMessage(itemsError, "Error al cargar ítems."), 500);
      }

      for (const item of items) {
        itemCounts[item.order_id] = (itemCounts[item.order_id] ?? 0) + 1;
      }
    }

    // Build lookup map
    for (const session of sessions) {
      const order = orders.find((o) => o.session_id === session.id);
      sessionMap[session.id] = {
        session_id: session.id,
        session_status: session.status,
        active_item_count: order ? (itemCounts[order.id] ?? 0) : 0,
        subtotal: order?.subtotal ?? null,
      };
    }
  }

  const result: CashierTable[] = tables.map((table) => {
    const sessionInfo = table.current_session_id
      ? (sessionMap[table.current_session_id] ?? null)
      : null;

    return {
      id: table.id,
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      pos_x: table.pos_x,
      pos_y: table.pos_y,
      status: table.status,
      current_session_id: table.current_session_id,
      session_status: sessionInfo?.session_status ?? null,
      active_item_count: sessionInfo?.active_item_count ?? 0,
      subtotal: sessionInfo?.subtotal ?? null,
    };
  });

  const parsed = cashierTablesResponseSchema.safeParse({ tables: result });

  if (!parsed.success) {
    return errorResponse("INTERNAL", "No pudimos interpretar las mesas.", 500);
  }

  return NextResponse.json(parsed.data);
}
