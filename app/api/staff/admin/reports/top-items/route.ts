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
    const { data: items, error } = await admin
      .from("order_items")
      .select("name_snapshot, price_snapshot, qty, status")
      .gte("created_at", fromRange.startIso)
      .lt("created_at", toRange.endIso);

    if (error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos cargar los items del periodo."),
        500,
      );
    }

    const excludedStatuses = new Set(["cart", "cancelled", "unavailable"]);
    const rowsByName = new Map<
      string,
      { name: string; totalQty: number; totalRevenue: number }
    >();

    for (const item of items ?? []) {
      if (excludedStatuses.has(item.status)) {
        continue;
      }

      const currentRow = rowsByName.get(item.name_snapshot) ?? {
        name: item.name_snapshot,
        totalQty: 0,
        totalRevenue: 0,
      };

      currentRow.totalQty += item.qty;
      currentRow.totalRevenue += item.qty * item.price_snapshot;
      rowsByName.set(item.name_snapshot, currentRow);
    }

    const rows = [...rowsByName.values()]
      .map((row) => ({
        name: row.name,
        totalQty: row.totalQty,
        totalRevenue: Number(row.totalRevenue.toFixed(2)),
      }))
      .sort((left, right) => {
        if (right.totalQty !== left.totalQty) {
          return right.totalQty - left.totalQty;
        }

        return right.totalRevenue - left.totalRevenue;
      })
      .slice(0, 10);

    return NextResponse.json({ rows });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar el reporte de productos."),
      500,
    );
  }
}
