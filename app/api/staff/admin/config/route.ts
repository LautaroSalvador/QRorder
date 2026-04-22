import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage, readJsonBody } from "@/lib/api-response";
import { getStaffSession } from "@/lib/auth/staff";
import { encryptText } from "@/lib/crypto";
import {
  normalizeSoundSettings,
  normalizeTipOptions,
} from "@/lib/restaurant-config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { adminConfigUpdateSchema } from "@/lib/validations/admin";

type RestaurantConfigUpdate =
  Database["public"]["Tables"]["restaurant_config"]["Update"];

export async function GET() {
  const session = await getStaffSession();
  if (!session || session.profile.role !== "admin") {
    return errorResponse("FORBIDDEN", "No tienes permisos de administrador.", 403);
  }

  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("restaurant_config")
      .select("name, mp_access_token, mp_public_key, settings, tip_options")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos cargar la configuracion."),
        500,
      );
    }

    return NextResponse.json({
      has_access_token: Boolean(data?.mp_access_token),
      has_public_key: Boolean(data?.mp_public_key),
      restaurant_name: data?.name?.trim() || "MesaQR",
      settings: normalizeSoundSettings(data?.settings),
      tip_options: normalizeTipOptions(data?.tip_options),
    });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar la configuracion."),
      500,
    );
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
    const { data: currentConfig, error: currentConfigError } = await admin
      .from("restaurant_config")
      .select("settings")
      .eq("id", 1)
      .single();

    if (currentConfigError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(currentConfigError, "No pudimos cargar la configuracion actual."),
        500,
      );
    }

    const updateData: RestaurantConfigUpdate = {};
    const nextSettings = normalizeSoundSettings(currentConfig.settings);

    if (parsedBody.data.restaurantName !== undefined) {
      updateData.name = parsedBody.data.restaurantName;
    }

    if (parsedBody.data.tipOptions !== undefined && parsedBody.data.tipOptions.length > 0) {
      updateData.tip_options = normalizeTipOptions(parsedBody.data.tipOptions);
    }

    if (parsedBody.data.kitchenNotificationsEnabled !== undefined) {
      nextSettings.kitchenNotificationsEnabled =
        parsedBody.data.kitchenNotificationsEnabled;
    }

    if (parsedBody.data.barNotificationsEnabled !== undefined) {
      nextSettings.barNotificationsEnabled = parsedBody.data.barNotificationsEnabled;
    }

    if (
      parsedBody.data.kitchenNotificationsEnabled !== undefined ||
      parsedBody.data.barNotificationsEnabled !== undefined
    ) {
      updateData.settings = nextSettings;
    }

    if (parsedBody.data.mpAccessToken) {
      updateData.mp_access_token = encryptText(parsedBody.data.mpAccessToken);
    }

    if (parsedBody.data.mpPublicKey !== undefined) {
      updateData.mp_public_key = encryptText(parsedBody.data.mpPublicKey);
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await admin
        .from("restaurant_config")
        .update(updateData)
        .eq("id", 1);

      if (error) {
        return errorResponse(
          "INTERNAL",
          getErrorMessage(error, "No pudimos actualizar la configuracion."),
          500,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos guardar la configuracion."),
      500,
    );
  }
}
