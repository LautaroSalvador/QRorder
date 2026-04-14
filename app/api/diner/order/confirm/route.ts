import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-response";
import { getDinerSession } from "@/lib/auth/diner-jwt";
import { getDinerOrderContext, recalculateOrderTotals } from "@/lib/diner";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const session = await getDinerSession(request);

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Sesión inválida.",
        },
      },
      { status: 401 },
    );
  }

  try {
    const context = await getDinerOrderContext(session.sessionId, session.tableId);

    if (!context) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No encontramos una orden activa para esta mesa.",
          },
        },
        { status: 404 },
      );
    }

    const admin = supabaseAdmin();
    const { data: cartItems, error: cartItemsError } = await admin
      .from("order_items")
      .select("id, status")
      .eq("order_id", context.order.id)
      .eq("status", "cart");

    if (cartItemsError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(cartItemsError, "No pudimos confirmar el pedido."),
          },
        },
        { status: 500 },
      );
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "No hay ítems en carrito para confirmar.",
          },
        },
        { status: 409 },
      );
    }

    const itemIds = cartItems.map((item) => item.id);
    const { error: updateError } = await admin
      .from("order_items")
      .update({
        status: "pending",
      })
      .in("id", itemIds);

    if (updateError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(updateError, "No pudimos confirmar el pedido."),
          },
        },
        { status: 500 },
      );
    }

    await admin.from("order_item_events").insert(
      cartItems.map((item) => ({
        actor_type: "diner" as const,
        from_status: item.status,
        order_item_id: item.id,
        to_status: "pending" as const,
      })),
    );

    await recalculateOrderTotals(context.order.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos confirmar el pedido."),
        },
      },
      { status: 500 },
    );
  }
}
