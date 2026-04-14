import "server-only";

import { randomUUID } from "crypto";

import { getErrorMessage } from "@/lib/api-response";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const MENU_IMAGES_BUCKET = "menu-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]+/g, "-").toLowerCase();
}

function extractPathFromPublicUrl(publicUrl: string) {
  const url = new URL(publicUrl);
  const marker = `/storage/v1/object/public/${MENU_IMAGES_BUCKET}/`;
  const markerIndex = url.pathname.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
}

export async function uploadMenuImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("La foto debe ser un archivo de imagen.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("La foto no puede superar los 5 MB.");
  }

  const admin = supabaseAdmin();
  const filePath = `${randomUUID()}-${sanitizeFileName(file.name)}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(MENU_IMAGES_BUCKET)
    .upload(filePath, fileBuffer, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      getErrorMessage(uploadError, "No pudimos subir la foto al storage."),
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl,
  };
}

export async function removeMenuImageByPublicUrl(publicUrl: string | null) {
  if (!publicUrl) {
    return;
  }

  const imagePath = extractPathFromPublicUrl(publicUrl);

  if (!imagePath) {
    return;
  }

  const admin = supabaseAdmin();

  await admin.storage.from(MENU_IMAGES_BUCKET).remove([imagePath]);
}
