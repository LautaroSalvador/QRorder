import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL",
        message: "Webhook pendiente de implementación en la Fase 5.",
      },
    },
    { status: 501 },
  );
}
