import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage, readJsonBody } from "@/lib/api-response";
import { getStaffSession } from "@/lib/auth/staff";
import { encryptText } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigUpdateSchema } from "@/lib/validations/admin";

export async function GET() {
  const session = await getStaffSession();
  if (!session || session.profile.role !== "admin") {
    return errorResponse("FORBIDDEN", "No tienes permisos de administrador.", 403);
  }

  try {
    const admin = supabaseAdmin();
    const { data: rawData, error } = await admin
      .from("restaurant_config")
      .select("mp_access_token, mp_public_key")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return errorResponse("INTERNAL", getErrorMessage(error, "No pudimos cargar la configuración."), 500);
    }

    const config = rawData as unknown as { mp_access_token: string | null; mp_public_key: string | null };

    return NextResponse.json({
      mp_public_key: config?.mp_public_key ?? null,
      has_access_token: !!config?.mp_access_token,
    });
  } catch (error) {
    return errorResponse("INTERNAL", getErrorMessage(error, "No pudimos cargar la configuración."), 500);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getStaffSession();
  if (!session || session.profile.role !== "admin") {
    return errorResponse("FORBIDDEN", "No tienes permisos de administrador.", 403);
  }

  const bodyResult = await readJsonBody(request);

  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const parsedBody = adminConfigUpdateSchema.safeParse(bodyResult.data);

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  try {
    const admin = supabaseAdmin();
    const updateData: Record<string, string> = {};

    if (parsedBody.data.mpAccessToken) {
      updateData.mp_access_token = encryptText(parsedBody.data.mpAccessToken);
    }

    if (parsedBody.data.mpPublicKey !== undefined) {
      updateData.mp_public_key = parsedBody.data.mpPublicKey;
    }

    if (Object.keys(updateData).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const { error } = await (admin.from("restaurant_config") as any)
        .update(updateData)
        .eq("id", 1);

      if (error) {
        return errorResponse("INTERNAL", getErrorMessage(error, "No pudimos actualizar la configuración."), 500);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse("INTERNAL", getErrorMessage(error, "No pudimos guardar la configuración."), 500);
  }
}
