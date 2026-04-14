"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/fetcher";
import { tableSchema } from "@/lib/validations/admin";

type TableRecord = z.infer<typeof tableSchema>;

type FeedbackState =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

const tablesQueryKey = ["admin", "tables"];

export function TablesManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const { data, isLoading, error } = useQuery({
    queryKey: tablesQueryKey,
    queryFn: () => fetchJson<TableRecord[]>("/api/staff/admin/tables"),
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<TableRecord>("/api/staff/admin/tables", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              number: Number(formData.get("number") ?? 0),
              name: String(formData.get("name") ?? ""),
              capacity: Number(formData.get("capacity") ?? 0),
            }),
          });
          form.reset();
          setFeedback({
            kind: "success",
            message: "Mesa creada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: tablesQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos crear la mesa.",
          });
        }
      })();
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, tableId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<TableRecord>(`/api/staff/admin/tables/${tableId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              number: Number(formData.get("number") ?? 0),
              name: String(formData.get("name") ?? ""),
              capacity: Number(formData.get("capacity") ?? 0),
            }),
          });
          setEditingId(null);
          setFeedback({
            kind: "success",
            message: "Mesa actualizada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: tablesQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos actualizar la mesa.",
          });
        }
      })();
    });
  }

  function handleDelete(table: TableRecord) {
    if (!window.confirm(`¿Eliminar la mesa "${table.name}"?`)) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<{ success: boolean }>(`/api/staff/admin/tables/${table.id}`, {
            method: "DELETE",
          });
          setFeedback({
            kind: "success",
            message: "Mesa eliminada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: tablesQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos eliminar la mesa.",
          });
        }
      })();
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nueva mesa</CardTitle>
          <CardDescription>
            Cargá el número, el nombre visible y la capacidad estimada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="table-number">Número</Label>
              <Input id="table-number" name="number" type="number" min={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-name">Nombre</Label>
              <Input id="table-name" name="name" placeholder="Mesa 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-capacity">Capacidad</Label>
              <Input
                id="table-capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              <Plus className="size-4" />
              Crear mesa
            </Button>
          </form>

          {feedback ? (
            <p
              className={`mt-4 text-sm ${
                feedback.kind === "error" ? "text-destructive" : "text-primary"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mesas</CardTitle>
          <CardDescription>
            En esta fase se administra el listado base sin layout visual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Cargando mesas...</p> : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "No pudimos cargar las mesas."}
            </p>
          ) : null}
          {!isLoading && !error && data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay mesas cargadas.
            </p>
          ) : null}

          <div className="space-y-4">
            {data?.map((table) => {
              const isEditing = editingId === table.id;

              return (
                <Card key={table.id} className="border-border/70 bg-muted-surface/60">
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={(event) => handleUpdate(event, table.id)}
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`number-${table.id}`}>Número</Label>
                            <Input
                              id={`number-${table.id}`}
                              name="number"
                              type="number"
                              min={1}
                              defaultValue={table.number}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`name-${table.id}`}>Nombre</Label>
                            <Input
                              id={`name-${table.id}`}
                              name="name"
                              defaultValue={table.name}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`capacity-${table.id}`}>Capacidad</Label>
                            <Input
                              id={`capacity-${table.id}`}
                              name="capacity"
                              type="number"
                              min={1}
                              defaultValue={table.capacity}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" disabled={isPending}>
                            Guardar cambios
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-medium">{table.name}</p>
                            <Badge variant="outline">N° {table.number}</Badge>
                            <Badge variant="secondary">
                              {table.capacity} personas
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Estado actual: {table.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingId(table.id)}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDelete(table)}
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
