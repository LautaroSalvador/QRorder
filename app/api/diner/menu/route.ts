import { NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { getPublishedMenu } from "@/lib/diner";
import { dinerMenuResponseSchema } from "@/lib/validations/diner";

export async function GET() {
  try {
    const categories = await getPublishedMenu();

    return NextResponse.json(
      dinerMenuResponseSchema.parse({
        categories,
      }),
    );
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar el menu."),
      500,
    );
  }
}
