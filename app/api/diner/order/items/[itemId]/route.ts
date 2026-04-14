import { NextRequest, NextResponse } from "next/server";

import { getDinerSession } from "@/lib/auth/diner-jwt";
import { getDinerOrderContext, recalculateOrderTotals } from "@/lib/diner";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  dinerItemParamsSchema,
  dinerOrderItemUpdateBodySchema,
} from "@/lib/validations/diner";
import { getErrorMessage } from "@/lib/api-response";

type DinerItemRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: DinerItemRouteContext) {
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

  const parsedParams = dinerItemParamsSchema.safeParse(await context.params);
  const json = await request.json().catch(() => null);
  const parsedBody = dinerOrderItemUpdateBodySchema.safeParse(json);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: parsedParams.error.message,
        },
      },
      { status: 400 },
    );
  }

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
    const contextData = await getDinerOrderContext(session.sessionId, session.tableId);

    if (!contextData) {
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
    const { data: item, error: itemError } = await admin
      .from("order_items")
      .select("id, order_id, status")
      .eq("id", parsedParams.data.itemId)
      .eq("order_id", contextData.order.id)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(itemError, "No pudimos cargar el ítem."),
          },
        },
        { status: 500 },
      );
    }

    if (!item) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "El ítem no existe en esta orden.",
          },
        },
        { status: 404 },
      );
    }

    if (item.status !== "cart") {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Solo podés editar ítems que siguen en carrito.",
          },
        },
        { status: 409 },
      );
    }

    const { error: updateError } = await admin
      .from("order_items")
      .update({
        notes: parsedBody.data.notes,
        qty: parsedBody.data.qty,
      })
      .eq("id", item.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(updateError, "No pudimos actualizar el ítem."),
          },
        },
        { status: 500 },
      );
    }

    await recalculateOrderTotals(contextData.order.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos actualizar el ítem."),
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: DinerItemRouteContext,
) {
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

  const parsedParams = dinerItemParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: parsedParams.error.message,
        },
      },
      { status: 400 },
    );
  }

  try {
    const contextData = await getDinerOrderContext(session.sessionId, session.tableId);

    if (!contextData) {
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
    const { data: item, error: itemError } = await admin
      .from("order_items")
      .select("id, order_id, status")
      .eq("id", parsedParams.data.itemId)
      .eq("order_id", contextData.order.id)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(itemError, "No pudimos cargar el ítem."),
          },
        },
        { status: 500 },
      );
    }

    if (!item) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "El ítem no existe en esta orden.",
          },
        },
        { status: 404 },
      );
    }

    if (item.status !== "cart") {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "Solo podés quitar ítems que siguen en carrito.",
          },
        },
        { status: 409 },
      );
    }

    const { error: deleteError } = await admin
      .from("order_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(deleteError, "No pudimos quitar el ítem."),
          },
        },
        { status: 500 },
      );
    }

    await recalculateOrderTotals(contextData.order.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos quitar el ítem."),
        },
      },
      { status: 500 },
    );
  }
}
