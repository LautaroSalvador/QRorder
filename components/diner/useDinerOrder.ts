"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/fetcher";
import { dinerOrderResponseSchema } from "@/lib/validations/diner";

export function useDinerOrder(enabled: boolean, tableId: string) {
  return useQuery({
    enabled,
    queryKey: ["diner-order", tableId],
    queryFn: async () =>
      dinerOrderResponseSchema.parse(await fetchJson("/api/diner/order")),
    refetchInterval: enabled ? 5_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
