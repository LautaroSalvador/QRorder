"use client";

import { RefreshCcw } from "lucide-react";

import { BarItemCard } from "@/components/bar/BarItemCard";
import { useBarQueue } from "@/components/bar/useBarQueue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ColumnSectionProps = {
  title: string;
  items: ReturnType<typeof useBarQueue>["data"];
  emptyMessage: string;
};

function ColumnSection({ title, items, emptyMessage }: ColumnSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">{items?.length ?? 0}</Badge>
      </div>

      {items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <BarItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export function BarKanban() {
  const { data, error, isFetching, isLoading, refetch } = useBarQueue();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Cargando cola de barra…
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No pudimos cargar la barra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado."}
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = data ?? [];
  const pendingItems = items.filter((item) => item.status === "pending");
  const inProgressItems = items.filter((item) => item.status === "in_progress");
  const readyItems = items.filter((item) => item.status === "ready");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Actualización automática cada 5 segundos
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={cn("size-4", isFetching ? "animate-spin" : undefined)}
          />
          ↻ Actualizar
        </Button>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Cola</TabsTrigger>
          <TabsTrigger value="runner">
            Para llevar
            {readyItems.length > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {readyItems.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <div className="grid gap-4 xl:grid-cols-3">
            <ColumnSection
              title="Pendientes"
              items={pendingItems}
              emptyMessage="No hay ítems pendientes en este momento."
            />
            <ColumnSection
              title="En preparación"
              items={inProgressItems}
              emptyMessage="Todavía no hay bebidas en preparación."
            />
            <ColumnSection
              title="Listos"
              items={readyItems}
              emptyMessage="Todavía no hay ítems listos para salir."
            />
          </div>
        </TabsContent>

        <TabsContent value="runner">
          {readyItems.length > 0 ? (
            <div className="space-y-4">
              {readyItems.map((item) => (
                <BarItemCard key={item.id} item={item} showTable />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-muted/40 px-6 text-center text-sm text-muted-foreground">
              No hay ítems listos para llevar
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
