import { NextRequest, NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { removeMenuImageByPublicUrl, uploadMenuImage } from "@/lib/supabase/menu-images";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createMenuItemSchema,
  emptyQuerySchema,
  menuItemCategorySchema,
  menuItemSchema,
} from "@/lib/validations/admin";

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
    .from("menu_items")
    .select(menuItemSelect)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar los ítems."),
      500,
    );
  }

  return NextResponse.json(menuItemSchema.array().parse(data));
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  const formData = await request.formData();
  const parsedBody = createMenuItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    categoryId: formData.get("categoryId"),
    available: parseBooleanField(formData.get("available")),
  });

  if (!parsedBody.success) {
    return errorResponse("INVALID_INPUT", parsedBody.error.message, 400);
  }

  const imageFile = getImageFromFormData(formData);
  let uploadedImageUrl: string | null = null;

  try {
    const category = await getCategory(parsedBody.data.categoryId);

    if (imageFile) {
      const uploadedImage = await uploadMenuImage(imageFile);
      uploadedImageUrl = uploadedImage.publicUrl;
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("menu_items")
      .insert({
        category_id: parsedBody.data.categoryId,
        name: parsedBody.data.name,
        description: parsedBody.data.description,
        price: parsedBody.data.price,
        image_url: uploadedImageUrl,
        available: parsedBody.data.available,
      })
      .select(menuItemSelect)
      .single();

    if (error) {
      if (uploadedImageUrl) {
        await removeMenuImageByPublicUrl(uploadedImageUrl);
      }

      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos crear el ítem."),
        500,
      );
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
      { status: 201 },
    );
  } catch (error) {
    if (uploadedImageUrl) {
      await removeMenuImageByPublicUrl(uploadedImageUrl);
    }

    return errorResponse(
      "INVALID_INPUT",
      getErrorMessage(error, "No pudimos validar el ítem."),
      400,
    );
  }
}
