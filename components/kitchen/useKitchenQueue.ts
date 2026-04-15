"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchJson } from "@/lib/fetcher";
import {
  kitchenItemsResponseSchema,
  updateKitchenItemResponseSchema,
  type KitchenItem,
  type KitchenItemStatus,
  type UpdateKitchenItemInput,
} from "@/lib/validations/kitchen";

const KITCHEN_ITEMS_QUERY_KEY = ["kitchen-items"] as const;

export type { KitchenItem, KitchenItemStatus };

export function useKitchenQueue() {
  return useQuery({
    queryKey: KITCHEN_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/staff/kitchen/items");

      return kitchenItemsResponseSchema.parse(data).items;
    },
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateKitchenItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateKitchenItemInput) => {
      const data = await fetchJson<unknown>("/api/staff/kitchen/items", {
        body: JSON.stringify(input),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      return updateKitchenItemResponseSchema.parse(data).item;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KITCHEN_ITEMS_QUERY_KEY });
    },
  });
}
