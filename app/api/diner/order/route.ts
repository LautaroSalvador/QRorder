import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-response";
import { getDinerOrder } from "@/lib/diner";
import { getDinerSession } from "@/lib/auth/diner-jwt";

export async function GET(request: NextRequest) {
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
    const order = await getDinerOrder(session.sessionId, session.tableId);

    if (!order) {
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

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos cargar el pedido."),
        },
      },
      { status: 500 },
    );
  }
}
