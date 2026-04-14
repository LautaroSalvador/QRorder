import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { removeMenuImageByPublicUrl, uploadMenuImage } from "@/lib/supabase/menu-images";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  menuItemCategorySchema,
  menuItemSchema,
  recordIdParamsSchema,
  updateMenuItemSchema,
} from "@/lib/validations/admin";

type MenuItemRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const menuItemSelect =
  "id, category_id, name, description, price, image_url, available, sort_order, created_at, updated_at, category:menu_categories(id, name, preparation_area)";

function parseBooleanField(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function getImageFromFormData(formData: FormData) {
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    return image;
  }

  return null;
}

async function getCategory(categoryId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("menu_categories")
    .select("id, name, preparation_area")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "No pudimos validar la categoría."));
  }

  if (!data) {
    throw new Error("La categoría seleccionada no existe.");
  }

  return menuItemCategorySchema.parse(data);
}

export async function PATCH(request: NextRequest, context: MenuItemRouteContext) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const parsedParams = recordIdParamsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return errorResponse("INVALID_INPUT", parsedParams.error.message, 400);
  }

  const formData = await request.formData();
  const parsedBody = updateMenuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    available: parseBooleanField(formData.get("available")),
  });

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const admin = supabaseAdmin();
  const { data: existingItem, error: existingItemError } = await admin
    .from("menu_items")
    .select("id, image_url")
    .eq("id", parsedParams.data.id)
    .maybeSingle();

  if (existingItemError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(existingItemError, "No pudimos cargar el ítem."),
      500,
    );
  }

  if (!existingItem) {
    return errorResponse("NOT_FOUND", "El ítem no existe.", 404);
  }

  const imageFile = getImageFromFormData(formData);
  let newImageUrl = existingItem.image_url;

  try {
    const category = await getCategory(parsedBody.data.categoryId);

    if (imageFile) {
      const uploadedImage = await uploadMenuImage(imageFile);
      newImageUrl = uploadedImage.publicUrl;
    }

    const { data, error } = await admin
      .from("menu_items")
      .update({
        category_id: parsedBody.data.categoryId,
        name: parsedBody.data.name,
        description: parsedBody.data.description,
        price: parsedBody.data.price,
        image_url: newImageUrl,
        available: parsedBody.data.available,
      })
      .eq("id", parsedParams.data.id)
      .select(menuItemSelect)
      .maybeSingle();

    if (error) {
      if (imageFile && newImageUrl && newImageUrl !== existingItem.image_url) {
        await removeMenuImageByPublicUrl(newImageUrl);
      }

      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos actualizar el ítem."),
        500,
      );
    }

    if (!data) {
      return errorResponse("NOT_FOUND", "El ítem no existe.", 404);
    }

    if (imageFile && existingItem.image_url && existingItem.image_url !== newImageUrl) {
      await removeMenuImageByPublicUrl(existingItem.image_url);
    }

    const itemPayload =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {};

    return NextResponse.json(
      menuItemSchema.parse({
        ...itemPayload,
        category,
      }),
    );
  } catch (error) {
    if (imageFile && newImageUrl && newImageUrl !== existingItem.image_url) {
      await removeMenuImageByPublicUrl(newImageUrl);
    }

    return errorResponse(
      "INVALID_INPUT",
      getErrorMessage(error, "No pudimos validar el ítem."),
      400,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: MenuItemRouteContext,
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
  const { data: existingItem, error: existingItemError } = await admin
    .from("menu_items")
    .select("id, image_url")
    .eq("id", parsedParams.data.id)
    .maybeSingle();

  if (existingItemError) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(existingItemError, "No pudimos cargar el ítem."),
      500,
    );
  }

  if (!existingItem) {
    return errorResponse("NOT_FOUND", "El ítem no existe.", 404);
  }

  const { error } = await admin
    .from("menu_items")
    .delete()
    .eq("id", parsedParams.data.id);

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos eliminar el ítem."),
      500,
    );
  }

  await removeMenuImageByPublicUrl(existingItem.image_url);

  return NextResponse.json({ success: true });
}
