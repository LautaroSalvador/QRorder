import "server-only";

import { cookies } from "next/headers";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import {
  DINER_COOKIE_NAME,
  getDinerSession,
  signDinerToken,
} from "@/lib/auth/diner-jwt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  dinerMenuCategorySchema,
  dinerOrderResponseSchema,
  dinerSessionResponseSchema,
  dinerTableSchema,
} from "@/lib/validations/diner";

type TableRow = Database["public"]["Tables"]["tables"]["Row"];
type TableSessionRow = Database["public"]["Tables"]["table_sessions"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type MenuCategoryRow = Database["public"]["Tables"]["menu_categories"]["Row"];
type TableSessionStatus = Database["public"]["Enums"]["table_session_status"];

function normalizeTable(table: Pick<TableRow, "id" | "name" | "number" | "status">) {
  return dinerTableSchema.parse({
    id: table.id,
    number: table.number,
    name: table.name,
    status: table.status,
  });
}

async function getTableById(tableId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("tables")
    .select("id, number, name, status, current_session_id")
    .eq("id", tableId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "No pudimos cargar la mesa."));
  }

  return data;
}

async function getSessionById(sessionId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("table_sessions")
    .select("id, table_id, opened_at, closed_at, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "No pudimos cargar la sesión."));
  }

  return data;
}

async function getOrderBySessionId(sessionId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("orders")
    .select("id, session_id, subtotal, tip, total, created_at, updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "No pudimos cargar la orden."));
  }

  return data;
}

async function getActiveSessionForTable(tableId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("table_sessions")
    .select("id, table_id, opened_at, closed_at, status")
    .eq("table_id", tableId)
    .in("status", ["open", "awaiting_payment"])
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "No pudimos buscar una sesión activa."));
  }

  return data;
}

async function createSessionForTable(table: Pick<TableRow, "id" | "status">) {
  const admin = supabaseAdmin();

  const { data: createdSession, error: sessionError } = await admin
    .from("table_sessions")
    .insert({
      table_id: table.id,
      status: "open",
    })
    .select("id, table_id, opened_at, closed_at, status")
    .single();

  if (sessionError) {
    throw new Error(getErrorMessage(sessionError, "No pudimos abrir la mesa."));
  }

  const { data: createdOrder, error: orderError } = await admin
    .from("orders")
    .insert({
      session_id: createdSession.id,
    })
    .select("id, session_id, subtotal, tip, total, created_at, updated_at")
    .single();

  if (orderError) {
    await admin.from("table_sessions").delete().eq("id", createdSession.id);
    throw new Error(getErrorMessage(orderError, "No pudimos crear la orden."));
  }

  const { error: tableUpdateError } = await admin
    .from("tables")
    .update({
      current_session_id: createdSession.id,
      status: "occupied",
    })
    .eq("id", table.id);

  if (tableUpdateError) {
    await admin.from("orders").delete().eq("id", createdOrder.id);
    await admin.from("table_sessions").delete().eq("id", createdSession.id);
    throw new Error(getErrorMessage(tableUpdateError, "No pudimos actualizar la mesa."));
  }

  return {
    order: createdOrder,
    session: createdSession,
  };
}

export async function getDinerEntryState(tableId: string) {
  const table = await getTableById(tableId);

  if (!table) {
    return {
      error: {
        code: "NOT_FOUND" as const,
        message: "La mesa no existe o el QR no es válido.",
      },
    };
  }

  if (!["available", "occupied"].includes(table.status)) {
    const message =
      table.status === "awaiting_payment"
        ? "La mesa está cerrando la cuenta en este momento."
        : "La mesa no está disponible ahora.";

    return {
      error: {
        code: "CONFLICT" as const,
        message,
      },
    };
  }

  return {
    table: normalizeTable(table),
  };
}

export async function ensureDinerSession(
  tableId: string,
  request: Request,
) {
  const table = await getTableById(tableId);

  if (!table) {
    return {
      response: errorResponse("NOT_FOUND", "La mesa no existe o el QR no es válido.", 404),
    };
  }

  if (!["available", "occupied"].includes(table.status)) {
    const message =
      table.status === "awaiting_payment"
        ? "La mesa está cerrando la cuenta en este momento."
        : "La mesa no está disponible ahora.";

    return {
      response: errorResponse("CONFLICT", message, 409),
    };
  }

  const cookieSession = await getDinerSession(request);

  if (cookieSession && cookieSession.tableId === tableId) {
    const activeSession = await getSessionById(cookieSession.sessionId);

    if (activeSession && activeSession.status === "open") {
      const existingOrder = await getOrderBySessionId(activeSession.id);

      if (existingOrder) {
        return {
          payload: dinerSessionResponseSchema.parse({
            orderId: existingOrder.id,
            resumed: true,
            sessionId: activeSession.id,
            table: normalizeTable(table),
          }),
        };
      }
    }
  }

  let session: TableSessionRow | null = null;
  let order: OrderRow | null = null;

  if (table.current_session_id) {
    session = await getSessionById(table.current_session_id);
  }

  if (!session || session.status !== "open") {
    session = await getActiveSessionForTable(table.id);
  }

  if (session) {
    order = await getOrderBySessionId(session.id);
  }

  if (!session || !order) {
    const created = await createSessionForTable(table);
    session = created.session;
    order = created.order;
  }

  return {
    payload: dinerSessionResponseSchema.parse({
      orderId: order.id,
      resumed: false,
      sessionId: session.id,
      table: normalizeTable({
        ...table,
        status: "occupied",
      }),
    }),
  };
}

export async function setDinerCookie(input: {
  sessionId: string;
  tableId: string;
}) {
  const token = await signDinerToken(input);
  const cookieStore = await cookies();

  cookieStore.set(DINER_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 6,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return token;
}

export async function getDinerOrderContext(
  sessionId: string,
  tableId: string,
  allowedStatuses: TableSessionStatus[] = ["open"],
) {
  const tableSession = await getSessionById(sessionId);

  if (
    !tableSession ||
    tableSession.table_id !== tableId ||
    !allowedStatuses.includes(tableSession.status)
  ) {
    return null;
  }

  const order = await getOrderBySessionId(sessionId);

  if (!order) {
    return null;
  }

  const table = await getTableById(tableId);

  if (!table) {
    return null;
  }

  return {
    order,
    table,
    tableSession,
  };
}

export async function recalculateOrderTotals(orderId: string) {
  const admin = supabaseAdmin();
  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("qty, price_snapshot, status")
    .eq("order_id", orderId);

  if (itemsError) {
    throw new Error(getErrorMessage(itemsError, "No pudimos recalcular la orden."));
  }

  const subtotal = items.reduce((accumulator, item) => {
    if (item.status === "cancelled" || item.status === "unavailable") {
      return accumulator;
    }

    return accumulator + item.qty * item.price_snapshot;
  }, 0);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("tip")
    .eq("id", orderId)
    .single();

  if (orderError) {
    throw new Error(getErrorMessage(orderError, "No pudimos recalcular la orden."));
  }

  const total = subtotal + order.tip;

  const { error: updateError } = await admin
    .from("orders")
    .update({
      subtotal,
      total,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(getErrorMessage(updateError, "No pudimos guardar la orden."));
  }

  return {
    subtotal,
    tip: order.tip,
    total,
  };
}

export async function getDinerOrder(sessionId: string, tableId: string) {
  const context = await getDinerOrderContext(sessionId, tableId, [
    "open",
    "awaiting_payment",
    "paid",
  ]);

  if (!context) {
    return null;
  }

  const admin = supabaseAdmin();
  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select(
      "id, menu_item_id, name_snapshot, price_snapshot, qty, notes, status, area, created_at",
    )
    .eq("order_id", context.order.id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(getErrorMessage(itemsError, "No pudimos cargar la orden."));
  }

  return dinerOrderResponseSchema.parse({
    orderId: context.order.id,
    sessionId: context.tableSession.id,
    sessionStatus: context.tableSession.status,
    subtotal: context.order.subtotal,
    tip: context.order.tip,
    total: context.order.total,
    items: items.map((item) => ({
      id: item.id,
      area: item.area,
      createdAt: item.created_at,
      menuItemId: item.menu_item_id,
      nameSnapshot: item.name_snapshot,
      notes: item.notes,
      priceSnapshot: item.price_snapshot,
      qty: item.qty,
      status: item.status,
    })),
    table: normalizeTable(context.table),
  });
}

export async function getPublishedMenu() {
  const admin = supabaseAdmin();
  const { data: categories, error: categoriesError } = await admin
    .from("menu_categories")
    .select("id, name, preparation_area, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(getErrorMessage(categoriesError, "No pudimos cargar el menú."));
  }

  const { data: items, error: itemsError } = await admin
    .from("menu_items")
    .select("id, category_id, name, description, price, image_url, sort_order")
    .eq("available", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (itemsError) {
    throw new Error(getErrorMessage(itemsError, "No pudimos cargar el menú."));
  }

  const itemsByCategory = new Map<string, typeof items>();

  items.forEach((item) => {
    const currentItems = itemsByCategory.get(item.category_id) ?? [];
    currentItems.push(item);
    itemsByCategory.set(item.category_id, currentItems);
  });

  return categories
    .map((category: Pick<MenuCategoryRow, "id" | "name" | "preparation_area">) =>
      dinerMenuCategorySchema.parse({
        id: category.id,
        name: category.name,
        preparationArea: category.preparation_area,
        items: (itemsByCategory.get(category.id) ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.image_url,
          price: item.price,
        })),
      }),
    )
    .filter((category) => category.items.length > 0);
}
