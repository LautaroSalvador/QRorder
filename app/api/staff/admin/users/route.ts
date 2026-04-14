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
  createStaffUserSchema,
  emptyQuerySchema,
  staffUserSchema,
} from "@/lib/validations/admin";
import { getAppEnv } from "@/lib/env";

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
  const [{ data: staffRows, error: staffError }, authUsersResponse] = await Promise.all([
    admin
      .from("staff_users")
      .select("id, email, full_name, role, active, created_at")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    }),
  ]);

  if (staffError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(staffError, "No pudimos cargar los usuarios."),
      500,
    );
  }

  if (authUsersResponse.error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(authUsersResponse.error, "No pudimos cargar las invitaciones."),
      500,
    );
  }

  const authUsersById = new Map(
    authUsersResponse.data.users.map((user) => [user.id, user]),
  );

  const payload = staffRows.map((staffUser) => {
    const authUser = authUsersById.get(staffUser.id);

    return {
      ...staffUser,
      invited_at: authUser?.invited_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });

  return NextResponse.json(staffUserSchema.array().parse(payload));
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

  const parsedBody = createStaffUserSchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { NEXT_PUBLIC_APP_URL } = getAppEnv();
  const redirectTo = new URL("/staff/login", NEXT_PUBLIC_APP_URL).toString();
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsedBody.data.email,
    {
      data: {
        full_name: parsedBody.data.fullName,
        role: parsedBody.data.role,
      },
      redirectTo,
    },
  );

  if (inviteError) {
    return errorResponse(
      getErrorCode(inviteError) === "email_exists" ? "CONFLICT" : "INTERNAL",
      getErrorMessage(inviteError, "No pudimos invitar al usuario."),
      getErrorCode(inviteError) === "email_exists" ? 409 : 500,
    );
  }

  if (!inviteData.user) {
    return errorResponse(
      "INTERNAL",
      "Supabase no devolvió el usuario invitado.",
      500,
    );
  }

  const { data, error } = await admin
    .from("staff_users")
    .insert({
      id: inviteData.user.id,
      email: inviteData.user.email ?? parsedBody.data.email,
      full_name: parsedBody.data.fullName,
      role: parsedBody.data.role,
      active: true,
    })
    .select("id, email, full_name, role, active, created_at")
    .single();

  if (error) {
    await admin.auth.admin.deleteUser(inviteData.user.id, true);

    const errorCode = getErrorCode(error);

    if (errorCode === "23505") {
      return errorResponse(
        "CONFLICT",
        "Ya existe un usuario staff con ese email.",
        409,
      );
    }

    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos crear el usuario staff."),
      500,
    );
  }

  return NextResponse.json(
    staffUserSchema.parse({
      ...data,
      invited_at: inviteData.user.invited_at ?? null,
      last_sign_in_at: inviteData.user.last_sign_in_at ?? null,
    }),
    { status: 201 },
  );
}
