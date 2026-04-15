"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchJson } from "@/lib/fetcher";
import {
  cashierTableDetailResponseSchema,
  cashierTablesResponseSchema,
  type AddTableItemInput,
  type CashierTable,
  type CashierTableDetail,
  type UpdateOrderItemInput,
} from "@/lib/validations/cashier";

export type { CashierTable, CashierTableDetail };

const CASHIER_TABLES_KEY = ["cashier-tables"] as const;
const tableDetailKey = (tableId: string) => ["cashier-table", tableId] as const;

// ─── List all tables (polling) ────────────────────────────────────────────────

export function useCashierTables() {
  return useQuery({
    queryKey: CASHIER_TABLES_KEY,
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/staff/tables");
      return cashierTablesResponseSchema.parse(data).tables;
    },
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// ─── Table detail (polling, only when drawer is open) ────────────────────────

export function useCashierTableDetail(tableId: string | null) {
  return useQuery({
    queryKey: tableDetailKey(tableId ?? ""),
    queryFn: async () => {
      const data = await fetchJson<unknown>(`/api/staff/tables/${tableId}`);
      return cashierTableDetailResponseSchema.parse(data).table;
    },
    enabled: tableId !== null,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

// ─── Add item to table ────────────────────────────────────────────────────────

export function useAddTableItem(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTableItemInput) => {
      await fetchJson<unknown>(`/api/staff/tables/${tableId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableDetailKey(tableId) });
      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}

// ─── Update / cancel order item ──────────────────────────────────────────────

export function useUpdateOrderItem(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, ...input }: UpdateOrderItemInput & { itemId: string }) => {
      await fetchJson<unknown>(`/api/staff/orders/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableDetailKey(tableId) });
      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}

// ─── Close table ──────────────────────────────────────────────────────────────

export function useCloseTable(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetchJson<unknown>(`/api/staff/tables/${tableId}/close`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableDetailKey(tableId) });
      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}

// ─── Mark paid offline ────────────────────────────────────────────────────────

export function useMarkPaidOffline(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetchJson<unknown>(`/api/staff/tables/${tableId}/mark-paid-offline`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableDetailKey(tableId) });
      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}

// ─── Reset table ──────────────────────────────────────────────────────────────

export function useResetTable(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetchJson<unknown>(`/api/staff/tables/${tableId}/reset`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tableDetailKey(tableId) });
      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}
