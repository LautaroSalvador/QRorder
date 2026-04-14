"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/fetcher";
import { categorySchema, menuItemSchema } from "@/lib/validations/admin";

type Category = z.infer<typeof categorySchema>;
type MenuItem = z.infer<typeof menuItemSchema>;

type FeedbackState =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

const categoriesQueryKey = ["admin", "categories"];
const menuItemsQueryKey = ["admin", "menu-items"];

export function MenuItemsManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => fetchJson<Category[]>("/api/staff/admin/categories"),
  });
  const menuItemsQuery = useQuery({
    queryKey: menuItemsQueryKey,
    queryFn: () => fetchJson<MenuItem[]>("/api/staff/admin/menu-items"),
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<MenuItem>("/api/staff/admin/menu-items", {
            method: "POST",
            body: formData,
          });
          form.reset();
          setFeedback({
            kind: "success",
            message: "Ítem creado correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: menuItemsQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos crear el ítem.",
          });
        }
      })();
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<MenuItem>(`/api/staff/admin/menu-items/${itemId}`, {
            method: "PATCH",
            body: formData,
          });
          setEditingId(null);
          setFeedback({
            kind: "success",
            message: "Ítem actualizado correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: menuItemsQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos actualizar el ítem.",
          });
        }
      })();
    });
  }

  function handleDelete(item: MenuItem) {
    if (!window.confirm(`¿Eliminar el ítem "${item.name}"?`)) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<{ success: boolean }>(
            `/api/staff/admin/menu-items/${item.id}`,
            {
              method: "DELETE",
            },
          );
          setFeedback({
            kind: "success",
            message: "Ítem eliminado correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: menuItemsQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos eliminar el ítem.",
          });
        }
      })();
    });
  }

  const categories = categoriesQuery.data ?? [];
  const menuItems = menuItemsQuery.data ?? [];
  const areCategoriesMissing =
    !categoriesQuery.isLoading && !categoriesQuery.error && categories.length === 0;

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Nuevo ítem</CardTitle>
          <CardDescription>
            Cargá los datos del producto, su categoría y la foto del menú.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {areCategoriesMissing ? (
            <p className="text-sm text-destructive">
              Primero necesitás crear al menos una categoría.
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input id="item-name" name="name" placeholder="Milanesa a caballo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Descripción</Label>
              <Textarea
                id="item-description"
                name="description"
                placeholder="Detalle corto para el menú"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-price">Precio</Label>
                <Input
                  id="item-price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="12500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Categoría</Label>
                <select
                  id="item-category"
                  name="categoryId"
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={areCategoriesMissing}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccioná una categoría
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-image">Foto</Label>
              <Input id="item-image" name="image" type="file" accept="image/*" />
            </div>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                name="available"
                type="checkbox"
                defaultChecked
                className="size-4 rounded border-border"
              />
              Disponible para el menú
            </label>
            <Button type="submit" className="w-full" disabled={isPending || areCategoriesMissing}>
              <Plus className="size-4" />
              Crear ítem
            </Button>
          </form>

          {feedback ? (
            <p
              className={`text-sm ${
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
          <CardTitle>Ítems del menú</CardTitle>
          <CardDescription>
            Editá los datos visibles del menú y la disponibilidad actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {menuItemsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando ítems...</p>
          ) : null}
          {menuItemsQuery.error ? (
            <p className="text-sm text-destructive">
              {menuItemsQuery.error instanceof Error
                ? menuItemsQuery.error.message
                : "No pudimos cargar los ítems."}
            </p>
          ) : null}
          {!menuItemsQuery.isLoading && !menuItemsQuery.error && menuItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ítems cargados.
            </p>
          ) : null}

          <div className="space-y-4">
            {menuItems.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <Card key={item.id} className="border-border/70 bg-muted-surface/60">
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={(event) => handleUpdate(event, item.id)}
                      >
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${item.id}`}>Nombre</Label>
                            <Input
                              id={`name-${item.id}`}
                              name="name"
                              defaultValue={item.name}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-${item.id}`}>Precio</Label>
                            <Input
                              id={`price-${item.id}`}
                              name="price"
                              type="number"
                              min={0}
                              step="0.01"
                              defaultValue={item.price}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`description-${item.id}`}>Descripción</Label>
                          <Textarea
                            id={`description-${item.id}`}
                            name="description"
                            defaultValue={item.description}
                          />
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`category-${item.id}`}>Categoría</Label>
                            <select
                              id={`category-${item.id}`}
                              name="categoryId"
                              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              defaultValue={item.category_id}
                            >
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`image-${item.id}`}>Reemplazar foto</Label>
                            <Input
                              id={`image-${item.id}`}
                              name="image"
                              type="file"
                              accept="image/*"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-3 text-sm font-medium">
                          <input
                            name="available"
                            type="checkbox"
                            defaultChecked={item.available}
                            className="size-4 rounded border-border"
                          />
                          Disponible para el menú
                        </label>
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
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-medium">{item.name}</p>
                            <Badge variant={item.available ? "default" : "secondary"}>
                              {item.available ? "Disponible" : "No disponible"}
                            </Badge>
                            {item.category ? (
                              <Badge variant="outline">{item.category.name}</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>${item.price.toFixed(2)}</span>
                            {item.image_url ? (
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                Ver foto
                                <ExternalLink className="size-3.5" />
                              </a>
                            ) : (
                              <span>Sin foto</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingId(item.id)}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
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
