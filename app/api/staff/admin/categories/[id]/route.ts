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
  categorySchema,
  recordIdParamsSchema,
  updateCategorySchema,
} from "@/lib/validations/admin";

type CategoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: CategoryRouteContext) {
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

  const parsedBody = updateCategorySchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("menu_categories")
    .update({
      name: parsedBody.data.name,
      preparation_area: parsedBody.data.preparationArea,
      sort_order: parsedBody.data.sortOrder,
    })
    .eq("id", parsedParams.data.id)
    .select("id, name, sort_order, preparation_area, active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos actualizar la categoría."),
      500,
    );
  }

  if (!data) {
    return errorResponse("NOT_FOUND", "La categoría no existe.", 404);
  }

  return NextResponse.json(categorySchema.parse(data));
}

export async function DELETE(
  _request: NextRequest,
  context: CategoryRouteContext,
) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = recordIdParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return errorResponse("INVALID_INPUT", parsedParams.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("menu_categories")
    .delete()
    .eq("id", parsedParams.data.id);

  if (error) {
    const errorCode = getErrorCode(error);

    if (errorCode === "23503") {
      return errorResponse(
        "CONFLICT",
        "No podés eliminar una categoría con ítems asociados.",
        409,
      );
    }

    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos eliminar la categoría."),
      500,
    );
  }

  return NextResponse.json({ success: true });
}
