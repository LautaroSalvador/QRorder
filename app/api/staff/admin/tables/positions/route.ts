import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateTablePositionsSchema } from "@/lib/validations/admin";

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const jsonBody = await readJsonBody(request);

  if ("response" in jsonBody) {
    return jsonBody.response;
  }

  const parsedBody = updateTablePositionsSchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const positions = Array.isArray(parsedBody.data)
    ? parsedBody.data
    : [parsedBody.data];

  const admin = supabaseAdmin();
  const updatedPositions: Array<{ id: string; pos_x: number; pos_y: number }> = [];

  for (const position of positions) {
    const { data, error } = await admin
      .from("tables")
      .update({
        pos_x: position.posX,
        pos_y: position.posY,
      })
      .eq("id", position.tableId)
      .select("id, pos_x, pos_y")
      .maybeSingle();

    if (error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos guardar la posicion de la mesa."),
        500,
      );
    }

    if (!data) {
      return errorResponse("NOT_FOUND", "La mesa no existe.", 404);
    }

    updatedPositions.push(data);
  }

  return NextResponse.json({ positions: updatedPositions });
}
