"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchJson } from "@/lib/fetcher";
import {
  barItemsResponseSchema,
  updateBarItemResponseSchema,
  type BarItem,
  type BarItemStatus,
  type UpdateBarItemInput,
} from "@/lib/validations/bar";

const BAR_ITEMS_QUERY_KEY = ["bar-items"] as const;

export type { BarItem, BarItemStatus };

export function useBarQueue() {
  return useQuery({
    queryKey: BAR_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/staff/bar/items");

      return barItemsResponseSchema.parse(data).items;
    },
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateBarItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateBarItemInput) => {
      const data = await fetchJson<unknown>("/api/staff/bar/items", {
        body: JSON.stringify(input),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      return updateBarItemResponseSchema.parse(data).item;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BAR_ITEMS_QUERY_KEY });
    },
  });
}
