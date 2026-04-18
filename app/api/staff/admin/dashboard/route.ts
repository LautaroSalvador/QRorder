import { NextResponse } from "next/server";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { getStaffSession } from "@/lib/auth/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DashboardTopItem = {
  name: string;
  qty: number;
};

function getTodayRange() {
  const now = new Date();
  const todayStart = new Date(now);

  todayStart.setUTCHours(3, 0, 0, 0);

  if (now.getUTCHours() < 3) {
    todayStart.setUTCDate(todayStart.getUTCDate() - 1);
  }

  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  return {
    todayEndIso: todayEnd.toISOString(),
    todayStartIso: todayStart.toISOString(),
  };
}

function sumOrderTotals(
  orders: Array<{
    session_id: string;
    total: number;
  }>,
  sessionIds: Set<string>,
) {
  return orders.reduce((accumulator, order) => {
    if (!sessionIds.has(order.session_id)) {
      return accumulator;
    }

    return accumulator + order.total;
  }, 0);
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export async function GET() {
  const session = await getStaffSession();

  if (!session) {
    return errorResponse("UNAUTHORIZED", "Sesion invalida.", 401);
  }

  if (session.profile.role !== "admin") {
    return errorResponse("FORBIDDEN", "No tienes permisos de administrador.", 403);
  }

  const { todayEndIso, todayStartIso } = getTodayRange();
  const admin = supabaseAdmin();

  try {
    const [
      closedSessionsResult,
      approvedPaymentsResult,
      activeSessionsResult,
      todayOrderItemsResult,
    ] = await Promise.all([
      admin
        .from("table_sessions")
        .select("id")
        .gte("closed_at", todayStartIso)
        .lt("closed_at", todayEndIso),
      admin
        .from("payments")
        .select("session_id")
        .eq("status", "approved")
        .gte("created_at", todayStartIso)
        .lt("created_at", todayEndIso),
      admin
        .from("table_sessions")
        .select("id")
        .in("status", ["open", "awaiting_payment"]),
      admin
        .from("order_items")
        .select("name_snapshot, qty, status")
        .gte("created_at", todayStartIso)
        .lt("created_at", todayEndIso),
    ]);

    if (closedSessionsResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(
          closedSessionsResult.error,
          "No pudimos calcular las ventas de hoy.",
        ),
        500,
      );
    }

    if (approvedPaymentsResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(
          approvedPaymentsResult.error,
          "No pudimos calcular los pagos aprobados de hoy.",
        ),
        500,
      );
    }

    if (activeSessionsResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(
          activeSessionsResult.error,
          "No pudimos calcular las mesas activas.",
        ),
        500,
      );
    }

    if (todayOrderItemsResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(
          todayOrderItemsResult.error,
          "No pudimos calcular los items mas pedidos.",
        ),
        500,
      );
    }

    const salesSessionIds = new Set<string>();

    for (const currentSession of closedSessionsResult.data ?? []) {
      salesSessionIds.add(currentSession.id);
    }

    for (const approvedPayment of approvedPaymentsResult.data ?? []) {
      salesSessionIds.add(approvedPayment.session_id);
    }

    const approvedPaymentSessionIds = [
      ...new Set(
        (approvedPaymentsResult.data ?? []).map((payment) => payment.session_id),
      ),
    ];

    const salesOrderSessions = [...salesSessionIds];

    const [salesOrdersResult, approvedOrdersResult] = await Promise.all([
      salesOrderSessions.length > 0
        ? admin
            .from("orders")
            .select("session_id, total")
            .in("session_id", salesOrderSessions)
        : Promise.resolve({ data: [], error: null }),
      approvedPaymentSessionIds.length > 0
        ? admin
            .from("orders")
            .select("session_id, total")
            .in("session_id", approvedPaymentSessionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (salesOrdersResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(salesOrdersResult.error, "No pudimos sumar las ventas de hoy."),
        500,
      );
    }

    if (approvedOrdersResult.error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(
          approvedOrdersResult.error,
          "No pudimos calcular el ticket promedio de hoy.",
        ),
        500,
      );
    }

    const ventasHoy = roundCurrency(
      sumOrderTotals(salesOrdersResult.data ?? [], salesSessionIds),
    );

    const approvedOrders = approvedOrdersResult.data ?? [];
    const ticketPromedio =
      approvedOrders.length > 0
        ? roundCurrency(
            approvedOrders.reduce((accumulator, order) => accumulator + order.total, 0) /
              approvedOrders.length,
          )
        : 0;

    const excludedStatuses = new Set(["cart", "cancelled", "unavailable"]);
    const itemTotals = new Map<string, number>();

    for (const item of todayOrderItemsResult.data ?? []) {
      if (excludedStatuses.has(item.status)) {
        continue;
      }

      const currentQty = itemTotals.get(item.name_snapshot) ?? 0;
      itemTotals.set(item.name_snapshot, currentQty + item.qty);
    }

    const topItems: DashboardTopItem[] = [...itemTotals.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((left, right) => {
        if (right.qty !== left.qty) {
          return right.qty - left.qty;
        }

        return left.name.localeCompare(right.name, "es-AR");
      })
      .slice(0, 3);

    return NextResponse.json({
      mesasActivas: activeSessionsResult.data?.length ?? 0,
      ticketPromedio,
      topItems,
      ventasHoy,
    });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos cargar los indicadores del dashboard."),
      500,
    );
  }
}
