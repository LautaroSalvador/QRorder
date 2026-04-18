import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { getStaffSession } from "@/lib/auth/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

const querySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha desde no puede ser mayor que la fecha hasta.",
        path: ["from"],
      });
    }
  });

function formatArtDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${year}-${month}-${day}`;
}

function getDefaultRange() {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 6);

  return {
    from: formatArtDate(fromDate),
    to: formatArtDate(toDate),
  };
}

function toUtcRange(date: string) {
  const start = new Date(`${date}T03:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    endIso: end.toISOString(),
    startIso: start.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getStaffSession();

  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sesion invalida.", 401);
  }

  const defaultRange = getDefaultRange();
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = querySchema.safeParse({
    from: rawQuery.from ?? defaultRange.from,
    to: rawQuery.to ?? defaultRange.to,
  });

  if (!parsedQuery.success) {
    return errorResponse("INVALID_INPUT", parsedQuery.error.message, 400);
  }

  const from = parsedQuery.data.from ?? defaultRange.from;
  const to = parsedQuery.data.to ?? defaultRange.to;
  const fromRange = toUtcRange(from);
  const toRange = toUtcRange(to);
  const admin = supabaseAdmin();

  try {
    const { data: orderItems, error: orderItemsError } = await admin
      .from("order_items")
      .select("accepted_at, menu_item_id, ready_at, status")
      .in("status", ["ready", "delivered"])
      .not("accepted_at", "is", null)
      .not("ready_at", "is", null)
      .gte("ready_at", fromRange.startIso)
      .lt("ready_at", toRange.endIso);

    if (orderItemsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(orderItemsError, "No pudimos cargar los tiempos de preparacion."),
        500,
      );
    }

    const menuItemIds = [
      ...new Set(
        (orderItems ?? [])
          .map((item) => item.menu_item_id)
          .filter((menuItemId): menuItemId is string => Boolean(menuItemId)),
      ),
    ];

    if (menuItemIds.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    const { data: menuItems, error: menuItemsError } = await admin
      .from("menu_items")
      .select("category_id, id")
      .in("id", menuItemIds);

    if (menuItemsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(menuItemsError, "No pudimos cargar los items del menu."),
        500,
      );
    }

    const categoryIds = [
      ...new Set(
        (menuItems ?? [])
          .map((menuItem) => menuItem.category_id)
          .filter((categoryId): categoryId is string => Boolean(categoryId)),
      ),
    ];

    const { data: categories, error: categoriesError } =
      categoryIds.length > 0
        ? await admin
            .from("menu_categories")
            .select("id, name")
            .in("id", categoryIds)
        : { data: [], error: null };

    if (categoriesError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(categoriesError, "No pudimos cargar las categorias."),
        500,
      );
    }

    const menuItemById = new Map(
      (menuItems ?? []).map((menuItem) => [menuItem.id, menuItem]),
    );
    const categoryById = new Map(
      (categories ?? []).map((category) => [category.id, category.name]),
    );
    const rowsByCategory = new Map<
      string,
      { categoryName: string; itemCount: number; totalSeconds: number }
    >();

    for (const item of orderItems ?? []) {
      if (!item.menu_item_id || !item.accepted_at || !item.ready_at) {
        continue;
      }

      const menuItem = menuItemById.get(item.menu_item_id);
      const categoryName = menuItem?.category_id
        ? categoryById.get(menuItem.category_id) ?? "Sin categoria"
        : "Sin categoria";
      const acceptedAt = new Date(item.accepted_at).getTime();
      const readyAt = new Date(item.ready_at).getTime();
      const diffSeconds = Math.max(0, Math.round((readyAt - acceptedAt) / 1000));
      const currentRow = rowsByCategory.get(categoryName) ?? {
        categoryName,
        itemCount: 0,
        totalSeconds: 0,
      };

      currentRow.itemCount += 1;
      currentRow.totalSeconds += diffSeconds;
      rowsByCategory.set(categoryName, currentRow);
    }

    const rows = [...rowsByCategory.values()]
      .map((row) => ({
        avgSeconds: Math.round(row.totalSeconds / row.itemCount),
        categoryName: row.categoryName,
        itemCount: row.itemCount,
      }))
      .sort((left, right) => left.avgSeconds - right.avgSeconds);

    return NextResponse.json({ rows });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar el reporte de preparacion."),
      500,
    );
  }
}
