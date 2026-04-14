"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, Pencil } from "lucide-react";
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
import { staffUserSchema } from "@/lib/validations/admin";

type StaffUser = z.infer<typeof staffUserSchema>;

type FeedbackState =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

const staffUsersQueryKey = ["admin", "staff-users"];

function formatDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StaffUsersManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();
  const { data, isLoading, error } = useQuery({
    queryKey: staffUsersQueryKey,
    queryFn: () => fetchJson<StaffUser[]>("/api/staff/admin/users"),
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<StaffUser>("/api/staff/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: String(formData.get("email") ?? ""),
              fullName: String(formData.get("fullName") ?? ""),
              role: String(formData.get("role") ?? ""),
            }),
          });
          form.reset();
          setFeedback({
            kind: "success",
            message: "Invitación enviada correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos invitar al usuario.",
          });
        }
      })();
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<StaffUser>(`/api/staff/admin/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: String(formData.get("role") ?? ""),
              active: formData.get("active") === "on",
            }),
          });
          setEditingId(null);
          setFeedback({
            kind: "success",
            message: "Usuario actualizado correctamente.",
          });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch (requestError) {
          setFeedback({
            kind: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "No pudimos actualizar el usuario.",
          });
        }
      })();
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Invitar staff</CardTitle>
          <CardDescription>
            Se crea el usuario en Supabase Auth y la fila en `staff_users`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="staff-full-name">Nombre completo</Label>
              <Input id="staff-full-name" name="fullName" placeholder="Ana Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                name="email"
                type="email"
                placeholder="ana@mesaqr.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Rol</Label>
              <select
                id="staff-role"
                name="role"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="cajero"
              >
                <option value="admin">Admin</option>
                <option value="cajero">Cajero</option>
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              <MailPlus className="size-4" />
              Invitar usuario
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
          <CardTitle>Usuarios staff</CardTitle>
          <CardDescription>
            Editá el rol y activá o desactivá accesos sin borrar historial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Cargando usuarios...</p> : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "No pudimos cargar los usuarios."}
            </p>
          ) : null}
          {!isLoading && !error && data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay usuarios staff cargados.
            </p>
          ) : null}

          <div className="space-y-4">
            {data?.map((staffUser) => {
              const isEditing = editingId === staffUser.id;

              return (
                <Card key={staffUser.id} className="border-border/70 bg-muted-surface/60">
                  <CardContent className="pt-6">
                    {isEditing ? (
                      <form
                        className="space-y-4"
                        onSubmit={(event) => handleUpdate(event, staffUser.id)}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`role-${staffUser.id}`}>Rol</Label>
                            <select
                              id={`role-${staffUser.id}`}
                              name="role"
                              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              defaultValue={staffUser.role}
                            >
                              <option value="admin">Admin</option>
                              <option value="cajero">Cajero</option>
                              <option value="cocina">Cocina</option>
                              <option value="barra">Barra</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`status-${staffUser.id}`}>Estado</Label>
                            <label
                              id={`status-${staffUser.id}`}
                              className="flex h-11 items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm"
                            >
                              <input
                                name="active"
                                type="checkbox"
                                defaultChecked={staffUser.active}
                                className="size-4 rounded border-border"
                              />
                              Usuario activo
                            </label>
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
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-medium">{staffUser.full_name}</p>
                            <Badge variant="outline">{staffUser.role}</Badge>
                            <Badge variant={staffUser.active ? "default" : "secondary"}>
                              {staffUser.active ? "Activo" : "Desactivado"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {staffUser.email}
                          </p>
                          <div className="grid gap-1 text-sm text-muted-foreground">
                            <span>Invitación: {formatDate(staffUser.invited_at)}</span>
                            <span>
                              Último ingreso: {formatDate(staffUser.last_sign_in_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingId(staffUser.id)}
                          >
                            <Pencil className="size-4" />
                            Editar
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
