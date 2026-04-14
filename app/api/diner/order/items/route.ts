import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-response";
import { getDinerSession } from "@/lib/auth/diner-jwt";
import { getDinerOrderContext, recalculateOrderTotals } from "@/lib/diner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dinerOrderItemBodySchema } from "@/lib/validations/diner";

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

  const json = await request.json().catch(() => null);
  const parsedBody = dinerOrderItemBodySchema.safeParse(json);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: parsedBody.error.message,
        },
      },
      { status: 400 },
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
    const { data: menuItem, error: menuItemError } = await admin
      .from("menu_items")
      .select("id, name, price, available, category_id")
      .eq("id", parsedBody.data.menuItemId)
      .maybeSingle();

    if (menuItemError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(menuItemError, "No pudimos cargar el ítem del menú."),
          },
        },
        { status: 500 },
      );
    }

    if (!menuItem || !menuItem.available) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "El ítem seleccionado no está disponible.",
          },
        },
        { status: 404 },
      );
    }

    const { data: category, error: categoryError } = await admin
      .from("menu_categories")
      .select("id, active, preparation_area")
      .eq("id", menuItem.category_id)
      .maybeSingle();

    if (categoryError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(categoryError, "No pudimos cargar la categoría."),
          },
        },
        { status: 500 },
      );
    }

    if (!category || !category.active) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "La categoría del ítem no está disponible.",
          },
        },
        { status: 404 },
      );
    }

    const { data: orderItem, error: orderItemError } = await admin
      .from("order_items")
      .insert({
        area: category.preparation_area,
        menu_item_id: menuItem.id,
        name_snapshot: menuItem.name,
        notes: parsedBody.data.notes,
        order_id: context.order.id,
        price_snapshot: menuItem.price,
        qty: parsedBody.data.qty,
        status: "cart",
      })
      .select(
        "id, menu_item_id, name_snapshot, notes, order_id, price_snapshot, qty, status, area, created_at",
      )
      .single();

    if (orderItemError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(orderItemError, "No pudimos agregar el ítem."),
          },
        },
        { status: 500 },
      );
    }

    await admin.from("order_item_events").insert({
      actor_type: "diner",
      from_status: null,
      order_item_id: orderItem.id,
      to_status: "cart",
    });

    await recalculateOrderTotals(context.order.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos agregar el ítem."),
        },
      },
      { status: 500 },
    );
  }
}
