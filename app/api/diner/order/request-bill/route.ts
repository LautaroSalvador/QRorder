import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-response";
import { getDinerOrderContext } from "@/lib/diner";
import { getDinerSession } from "@/lib/auth/diner-jwt";
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

    if (context.tableSession.status !== "open") {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message:
              context.tableSession.status === "awaiting_payment"
                ? "La cuenta ya fue pedida y está siendo procesada."
                : "La sesión de esta mesa ya está cerrada.",
          },
        },
        { status: 409 },
      );
    }

    const admin = supabaseAdmin();

    // Marcar la mesa como awaiting_payment para que el cajero lo vea en su poll
    const { error: tableError } = await admin
      .from("tables")
      .update({ status: "awaiting_payment" })
      .eq("id", context.table.id);

    if (tableError) {
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: getErrorMessage(tableError, "No pudimos procesar el pedido de cuenta."),
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos procesar el pedido de cuenta."),
        },
      },
      { status: 500 },
    );
  }
}
