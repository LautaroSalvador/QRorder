import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage, readJsonBody } from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  recordIdParamsSchema,
  staffUserSchema,
  updateStaffUserSchema,
} from "@/lib/validations/admin";

type StaffUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: StaffUserRouteContext,
) {
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

  const parsedBody = updateStaffUserSchema.safeParse(jsonBody.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  if (
    parsedParams.data.id === auth.session.user.id &&
    (!parsedBody.data.active || parsedBody.data.role !== "admin")
  ) {
    return errorResponse(
      "CONFLICT",
      "No podés desactivarte ni quitarte el rol admin desde tu propia sesión.",
      409,
    );
  }

  const admin = supabaseAdmin();
  const { data: existingUser, error: existingUserError } = await admin
    .from("staff_users")
    .select("id, email, full_name, role, active, created_at")
    .eq("id", parsedParams.data.id)
    .maybeSingle();

  if (existingUserError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(existingUserError, "No pudimos cargar el usuario."),
      500,
    );
  }

  if (!existingUser) {
    return errorResponse("NOT_FOUND", "El usuario no existe.", 404);
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    parsedParams.data.id,
    {
      user_metadata: {
        full_name: existingUser.full_name,
        role: parsedBody.data.role,
      },
    },
  );

  if (authUpdateError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(authUpdateError, "No pudimos actualizar el usuario en Auth."),
      500,
    );
  }

  const { data, error } = await admin
    .from("staff_users")
    .update({
      role: parsedBody.data.role,
      active: parsedBody.data.active,
    })
    .eq("id", parsedParams.data.id)
    .select("id, email, full_name, role, active, created_at")
    .maybeSingle();

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos actualizar el usuario staff."),
      500,
    );
  }

  if (!data) {
    return errorResponse("NOT_FOUND", "El usuario no existe.", 404);
  }

  const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(
    parsedParams.data.id,
  );

  if (authUserError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(authUserError, "No pudimos cargar el usuario actualizado."),
      500,
    );
  }

  return NextResponse.json(
    staffUserSchema.parse({
      ...data,
      invited_at: authUserData.user?.invited_at ?? null,
      last_sign_in_at: authUserData.user?.last_sign_in_at ?? null,
    }),
  );
}
