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
import { categorySchema } from "@/lib/validations/admin";

type Category = z.infer<typeof categorySchema>;

type FeedbackState =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

const categoryQueryKey = ["admin", "categories"];

export function CategoriesManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const { data, isLoading, error } = useQuery({
    queryKey: categoryQueryKey,
    queryFn: () => fetchJson<Category[]>("/api/staff/admin/categories"),
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<Category>("/api/staff/admin/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: String(formData.get("name") ?? ""),
              preparationArea: String(formData.get("preparationArea") ?? ""),
              sortOrder: Number(formData.get("sortOrder") ?? 0),
            }),
          });
          form.reset();
          setFeedback({
            kind: "success",
            message: "Categoría creada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: categoryQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos crear la categoría.",
          });
        }
      })();
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, categoryId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<Category>(`/api/staff/admin/categories/${categoryId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: String(formData.get("name") ?? ""),
              preparationArea: String(formData.get("preparationArea") ?? ""),
              sortOrder: Number(formData.get("sortOrder") ?? 0),
            }),
          });
          setEditingId(null);
          setFeedback({
            kind: "success",
            message: "Categoría actualizada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: categoryQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos actualizar la categoría.",
          });
        }
      })();
    });
  }

  function handleDelete(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<{ success: boolean }>(
            `/api/staff/admin/categories/${category.id}`,
            {
              method: "DELETE",
            },
          );
          setFeedback({
            kind: "success",
            message: "Categoría eliminada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: categoryQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos eliminar la categoría.",
          });
        }
      })();
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nueva categoría</CardTitle>
          <CardDescription>
            Definí el nombre, el área y el orden en que se muestra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input id="category-name" name="name" placeholder="Entradas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-area">Área</Label>
              <select
                id="category-area"
                name="preparationArea"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="cocina"
              >
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-order">Orden</Label>
              <Input
                id="category-order"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              <Plus className="size-4" />
              Crear categoría
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
          <CardTitle>Categorías</CardTitle>
          <CardDescription>
            Administrá el orden y el área de preparación del menú.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando categorías...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "No pudimos cargar las categorías."}
            </p>
          ) : null}
          {!isLoading && !error && data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay categorías cargadas.
            </p>
          ) : null}

          <div className="space-y-4">
            {data?.map((category) => {
              const isEditing = editingId === category.id;

              return (
                <Card key={category.id} className="border-border/70 bg-muted-surface/60">
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={(event) => handleUpdate(event, category.id)}
                      >
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${category.id}`}>Nombre</Label>
                            <Input
                              id={`name-${category.id}`}
                              name="name"
                              defaultValue={category.name}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`area-${category.id}`}>Área</Label>
                            <select
                              id={`area-${category.id}`}
                              name="preparationArea"
                              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              defaultValue={category.preparation_area}
                            >
                              <option value="cocina">Cocina</option>
                              <option value="barra">Barra</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`order-${category.id}`}>Orden</Label>
                            <Input
                              id={`order-${category.id}`}
                              name="sortOrder"
                              type="number"
                              min={0}
                              defaultValue={category.sort_order}
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
                            <p className="text-lg font-medium">{category.name}</p>
                            <Badge variant="outline">
                              {category.preparation_area}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Orden de display: {category.sort_order}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingId(category.id)}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDelete(category)}
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
