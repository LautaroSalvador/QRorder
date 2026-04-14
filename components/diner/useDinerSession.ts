"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetcher";
import { dinerSessionResponseSchema } from "@/lib/validations/diner";

type DinerSessionState = {
  data: ReturnType<typeof dinerSessionResponseSchema.parse> | null;
  error: string | null;
  isLoading: boolean;
};

export function useDinerSession(tableId: string) {
  const [state, setState] = useState<DinerSessionState>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const data = dinerSessionResponseSchema.parse(
          await fetchJson("/api/diner/session", {
            body: JSON.stringify({ tableId }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          }),
        );

        if (!isMounted) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "No pudimos abrir la sesión de mesa.",
          isLoading: false,
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tableId]);

  return state;
}
