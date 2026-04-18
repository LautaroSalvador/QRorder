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
    const { data: sessions, error: sessionsError } = await admin
      .from("table_sessions")
      .select("id, closed_at")
      .gte("closed_at", fromRange.startIso)
      .lt("closed_at", toRange.endIso);

    if (sessionsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(sessionsError, "No pudimos cargar las sesiones del periodo."),
        500,
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    const sessionIds = sessions.map((currentSession) => currentSession.id);
    const [{ data: orders, error: ordersError }, { data: payments, error: paymentsError }] =
      await Promise.all([
        admin
          .from("orders")
          .select("id, session_id, total")
          .in("session_id", sessionIds),
        admin
          .from("payments")
          .select("session_id")
          .eq("status", "approved")
          .in("session_id", sessionIds),
      ]);

    if (ordersError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(ordersError, "No pudimos cargar las ordenes del periodo."),
        500,
      );
    }

    if (paymentsError) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(paymentsError, "No pudimos cargar los pagos del periodo."),
        500,
      );
    }

    const approvedSessionIds = new Set(
      (payments ?? []).map((payment) => payment.session_id),
    );
    const sessionById = new Map(
      sessions.map((currentSession) => [currentSession.id, currentSession]),
    );
    const rowsByDate = new Map<string, { date: string; orderCount: number; total: number }>();

    for (const order of orders ?? []) {
      if (!approvedSessionIds.has(order.session_id)) {
        continue;
      }

      const currentSession = sessionById.get(order.session_id);
      if (!currentSession?.closed_at) {
        continue;
      }

      const date = formatArtDate(new Date(currentSession.closed_at));
      const currentRow = rowsByDate.get(date) ?? {
        date,
        orderCount: 0,
        total: 0,
      };

      currentRow.orderCount += 1;
      currentRow.total += order.total;
      rowsByDate.set(date, currentRow);
    }

    const rows = [...rowsByDate.values()]
      .map((row) => ({
        date: row.date,
        orderCount: row.orderCount,
        total: Number(row.total.toFixed(2)),
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    return NextResponse.json({ rows });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar el reporte de ventas."),
      500,
    );
  }
}
