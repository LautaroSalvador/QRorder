import { NextRequest, NextResponse } from "next/server";

import {
  errorResponse,
  getErrorCode,
  getErrorMessage,
  readJsonBody,
} from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  recordIdParamsSchema,
  tableSchema,
  updateTableSchema,
} from "@/lib/validations/admin";

type TableRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: TableRouteContext) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = recordIdParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return errorResponse("INVALID_INPUT", parsedParams.error.message, 400);
  }

  const jsonBody = await readJsonBody(request);

  if ("response" in jsonBody) {
    return jsonBody.response;
  }

  const parsedBody = updateTableSchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("tables")
    .update({
      number: parsedBody.data.number,
      name: parsedBody.data.name,
      capacity: parsedBody.data.capacity,
    })
    .eq("id", parsedParams.data.id)
    .select("id, number, name, capacity, status, created_at, updated_at")
    .maybeSingle();

  if (error) {
    const errorCode = getErrorCode(error);

    if (errorCode === "23505") {
      return errorResponse(
        "CONFLICT",
        "Ya existe una mesa con ese número.",
        409,
      );
    }

    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos actualizar la mesa."),
      500,
    );
  }

  if (!data) {
    return errorResponse("NOT_FOUND", "La mesa no existe.", 404);
  }

  return NextResponse.json(tableSchema.parse(data));
}

export async function DELETE(_request: NextRequest, context: TableRouteContext) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = recordIdParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return errorResponse("INVALID_INPUT", parsedParams.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("tables").delete().eq("id", parsedParams.data.id);

  if (error) {
    const errorCode = getErrorCode(error);

    if (errorCode === "23503") {
      return errorResponse(
        "CONFLICT",
        "No podés eliminar una mesa con historial de sesiones.",
        409,
      );
    }

    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos eliminar la mesa."),
      500,
    );
  }

  return NextResponse.json({ success: true });
}
