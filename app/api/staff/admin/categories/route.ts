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
  createCategorySchema,
  emptyQuerySchema,
} from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedQuery = emptyQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!parsedQuery.success) {
    return errorResponse("INVALID_INPUT", parsedQuery.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("menu_categories")
    .select("id, name, sort_order, preparation_area, active, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar las categorías."),
      500,
    );
  }

  return NextResponse.json(categorySchema.array().parse(data));
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const jsonBody = await readJsonBody(request);

  if ("response" in jsonBody) {
    return jsonBody.response;
  }

  const parsedBody = createCategorySchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("menu_categories")
    .insert({
      name: parsedBody.data.name,
      preparation_area: parsedBody.data.preparationArea,
      sort_order: parsedBody.data.sortOrder,
    })
    .select("id, name, sort_order, preparation_area, active, created_at, updated_at")
    .single();

  if (error) {
    const errorCode = getErrorCode(error);

    if (errorCode === "23505") {
      return errorResponse(
        "CONFLICT",
        "Ya existe una categoría con esos datos.",
        409,
      );
    }

    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos crear la categoría."),
      500,
    );
  }

  return NextResponse.json(categorySchema.parse(data), { status: 201 });
}
