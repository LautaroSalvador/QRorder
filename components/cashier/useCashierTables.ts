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
  type UpdateTablePositionInput,
} from "@/lib/validations/cashier";

export type { CashierTable, CashierTableDetail };

const CASHIER_TABLES_KEY = ["cashier-tables"] as const;
const tableDetailKey = (tableId: string) => ["cashier-table", tableId] as const;

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

export function useUpdateTablePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTablePositionInput) => {
      await fetchJson<unknown>("/api/staff/admin/tables/positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    },
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData<CashierTable[] | undefined>(
        CASHIER_TABLES_KEY,
        (currentTables) =>
          currentTables?.map((table) =>
            table.id === variables.tableId
              ? {
                  ...table,
                  pos_x: variables.posX,
                  pos_y: variables.posY,
                }
              : table,
          ),
      );

      await queryClient.invalidateQueries({ queryKey: CASHIER_TABLES_KEY });
    },
  });
}

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
