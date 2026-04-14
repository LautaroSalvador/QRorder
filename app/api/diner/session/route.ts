import { NextRequest, NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-response";
import { ensureDinerSession, setDinerCookie } from "@/lib/diner";
import { dinerSessionBodySchema } from "@/lib/validations/diner";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsedBody = dinerSessionBodySchema.safeParse(json);

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
    const session = await ensureDinerSession(parsedBody.data.tableId, request);

    if ("response" in session) {
      return session.response;
    }

    const token = await setDinerCookie({
      sessionId: session.payload.sessionId,
      tableId: parsedBody.data.tableId,
    });

    const response = NextResponse.json(session.payload);

    response.cookies.set("mesaqr_diner", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 6,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: getErrorMessage(error, "No pudimos abrir la sesión de mesa."),
        },
      },
      { status: 500 },
    );
  }
}
