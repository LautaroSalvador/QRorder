"use client";

import { KitchenItemCard } from "@/components/kitchen/KitchenItemCard";
import { useKitchenQueue } from "@/components/kitchen/useKitchenQueue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ColumnSectionProps = {
  title: string;
  items: ReturnType<typeof useKitchenQueue>["data"];
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
            <KitchenItemCard key={item.id} item={item} />
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

export function KitchenKanban() {
  const { data, error, isFetching, isLoading, refetch } = useKitchenQueue();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Cargando cola de cocina…
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No pudimos cargar la cocina</CardTitle>
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
      <div className="flex items-center gap-2 rounded-[1.75rem] border border-border/80 bg-card px-4 py-2.5 shadow-sm">
        <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-sm text-muted-foreground">En vivo · actualización automática cada 5 s</p>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">Cola</TabsTrigger>
          <TabsTrigger value="runner">
            Cola de mesero
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
              emptyMessage="Todavía no hay platos en preparación."
            />
            <ColumnSection
              title="Listos"
              items={readyItems}
              emptyMessage="Todavía no hay platos listos para salir."
            />
          </div>
        </TabsContent>

        <TabsContent value="runner">
          {readyItems.length > 0 ? (
            <div className="space-y-4">
              {readyItems.map((item) => (
                <KitchenItemCard key={item.id} item={item} showTable />
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-muted/40 px-6 text-center text-sm text-muted-foreground">
              No hay platos listos para despachar al salón.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
