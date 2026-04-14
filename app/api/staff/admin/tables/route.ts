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
  createTableSchema,
  emptyQuerySchema,
  tableSchema,
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
    .from("tables")
    .select("id, number, name, capacity, status, created_at, updated_at")
    .order("number", { ascending: true });

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar las mesas."),
      500,
    );
  }

  return NextResponse.json(tableSchema.array().parse(data));
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

  const parsedBody = createTableSchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("tables")
    .insert({
      number: parsedBody.data.number,
      name: parsedBody.data.name,
      capacity: parsedBody.data.capacity,
    })
    .select("id, number, name, capacity, status, created_at, updated_at")
    .single();

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
      getErrorMessage(error, "No pudimos crear la mesa."),
      500,
    );
  }

  return NextResponse.json(tableSchema.parse(data), { status: 201 });
}
