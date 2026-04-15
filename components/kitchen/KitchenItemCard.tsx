"use client";

import { useEffect, useMemo, useState } from "react";

import { useUpdateKitchenItem, type KitchenItem } from "@/components/kitchen/useKitchenQueue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type KitchenItemCardProps = {
  item: KitchenItem;
  showTable?: boolean;
};

function formatElapsedTime(createdAt: string, now: number) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 1_000),
  );

  const hours = Math.floor(elapsedSeconds / 3_600);
  const minutes = Math.floor((elapsedSeconds % 3_600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function KitchenItemCard({
  item,
  showTable = false,
}: KitchenItemCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const updateKitchenItem = useUpdateKitchenItem();
  const table = item.orders?.table_sessions?.table ?? null;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const elapsedTime = useMemo(
    () => formatElapsedTime(item.created_at, now),
    [item.created_at, now],
  );

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-base font-semibold leading-6">
              {item.name_snapshot}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">x{item.qty}</Badge>
              <Badge variant="outline">{elapsedTime}</Badge>
            </div>
          </div>
        </div>

        {item.notes ? (
          <p className="text-sm italic leading-6 text-muted-foreground">
            Aclaraciones: {item.notes}
          </p>
        ) : null}

        {showTable ? (
          <p className="text-sm font-medium text-muted-foreground">
            {table ? `${table.name} · Mesa ${table.number}` : "Mesa sin asignar"}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {item.status === "pending" ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={updateKitchenItem.isPending}
                onClick={() =>
                  updateKitchenItem.mutate({
                    id: item.id,
                    status: "in_progress",
                  })
                }
              >
                Tomar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={updateKitchenItem.isPending}
                onClick={() =>
                  updateKitchenItem.mutate({
                    id: item.id,
                    status: "unavailable",
                  })
                }
              >
                No disponible
              </Button>
            </>
          ) : null}

          {item.status === "in_progress" ? (
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={updateKitchenItem.isPending}
              onClick={() =>
                updateKitchenItem.mutate({
                  id: item.id,
                  status: "ready",
                })
              }
            >
              Marcar listo
            </Button>
          ) : null}

          {item.status === "ready" && showTable ? (
            <Button
              type="button"
              size="sm"
              disabled={updateKitchenItem.isPending}
              onClick={() =>
                updateKitchenItem.mutate({
                  id: item.id,
                  status: "delivered",
                })
              }
            >
              Entregado
            </Button>
          ) : null}
        </div>

        {updateKitchenItem.error ? (
          <p className="text-sm text-destructive">
            {updateKitchenItem.error instanceof Error
              ? updateKitchenItem.error.message
              : "No pudimos actualizar el ítem."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
