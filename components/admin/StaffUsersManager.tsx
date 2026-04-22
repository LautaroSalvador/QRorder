"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  GlassWater,
  MailPlus,
  Pencil,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  cajero: "Cajero",
  cocina: "Cocina",
  barra: "Barra",
};

const rolePillColors: Record<string, string> = {
  admin: "bg-[#fbeadb] text-[#c14418] dark:bg-[#c14418]/20 dark:text-[#f97316]",
  cajero: "bg-secondary text-foreground",
  cocina: "bg-blue-100/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  barra: "bg-purple-100/70 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatRegisteredDate(invited_at: string | null, created_at: string): string {
  const dateStr = invited_at ?? created_at;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("email rate")) {
      return "Se alcanzó el límite de invitaciones. Esperá unos minutos antes de volver a intentarlo.";
    }
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return "Este email ya está registrado como miembro del staff.";
    }
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}

export function StaffUsersManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  const { data, isLoading } = useQuery({
    queryKey: staffUsersQueryKey,
    queryFn: () => fetchJson<StaffUser[]>("/api/staff/admin/users"),
  });

  const total = data?.length ?? 0;
  const actives = data?.filter((u) => u.active).length ?? 0;
  const inactives = total - actives;
  const enCocina = data?.filter((u) => u.role === "cocina" && u.active).length ?? 0;
  const enBarra = data?.filter((u) => u.role === "barra" && u.active).length ?? 0;
  const cajeros = data?.filter((u) => u.role === "cajero" && u.active).length ?? 0;

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(() => {
      void (async () => {
        setFeedback(null);
        try {
          await fetchJson<StaffUser>("/api/staff/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: String(formData.get("email") ?? ""),
              fullName: String(formData.get("fullName") ?? ""),
              role: String(formData.get("role") ?? ""),
            }),
          });
          form.reset();
          setIsAdding(false);
          setFeedback({ kind: "success", message: "Invitación enviada correctamente." });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch (requestError) {
          setFeedback({ kind: "error", message: parseApiError(requestError) });
        }
      })();
    });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        setFeedback(null);
        try {
          await fetchJson<StaffUser>(`/api/staff/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: String(formData.get("role") ?? ""),
              active: formData.get("active") === "on",
            }),
          });
          setEditingId(null);
          setFeedback({ kind: "success", message: "Usuario actualizado correctamente." });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch (requestError) {
          setFeedback({ kind: "error", message: parseApiError(requestError) });
        }
      })();
    });
  }

  function handleToggleActive(userId: string, currentRole: string, currentStatus: boolean) {
    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<StaffUser>(`/api/staff/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: currentRole, active: !currentStatus }),
          });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch (error) {
          setFeedback({ kind: "error", message: parseApiError(error) });
        }
      })();
    });
  }

  return (
    <div className="space-y-8 pb-12 relative pt-2">
      {/* Add button */}
      <div className="absolute right-0 -top-[4.5rem]">
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="h-11 px-6 rounded-xl font-medium shadow-md shadow-primary/20"
        >
          {isAdding ? <X className="size-5 mr-1" /> : <UserPlus className="size-5 mr-1.5" />}
          {isAdding ? "Cancelar" : "Añadir Miembro"}
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="bg-card shadow-sm rounded-3xl p-8 mb-8 border border-border/40 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold mb-6">Invitar Nuevo Miembro</h3>
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
            onSubmit={handleCreate}
          >
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Nombre completo
              </label>
              <Input
                name="fullName"
                placeholder="Ej: Ana Pérez"
                required
                className="h-12 bg-secondary/30 border-transparent rounded-xl text-md px-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="ana@mesaqr.com"
                required
                className="h-12 bg-secondary/30 border-transparent rounded-xl text-md px-4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Rol asignado
              </label>
              <select
                name="role"
                className="h-12 w-full rounded-xl bg-secondary/30 border-transparent px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                defaultValue="cajero"
              >
                <option value="admin">Administrador</option>
                <option value="cajero">Cajero</option>
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
              </select>
            </div>
            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={isPending}
            >
              <MailPlus className="size-5 mr-2" />
              Enviar Invitación
            </Button>
          </form>
        </div>
      )}

      {/* Feedback */}
      {feedback ? (
        <p
          className={`text-sm font-medium p-3 rounded-lg ${
            feedback.kind === "error"
              ? "text-destructive bg-destructive/10"
              : "text-green-700 bg-green-500/10"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="bg-card p-2 rounded-lg shadow-sm">
              <Users className="size-5 text-primary" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">Total Staff</span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold tracking-tighter text-foreground">{total}</span>
            <span className="text-sm text-muted-foreground font-medium">
              {actives} activos · {inactives} inactivos
            </span>
          </div>
        </div>

        <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="bg-card p-2 rounded-lg shadow-sm">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">Activos hoy</span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold tracking-tighter text-foreground">{actives}</span>
            <span className="text-sm text-muted-foreground font-medium">Con acceso al sistema</span>
          </div>
        </div>

        <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <div className="bg-card p-2 rounded-lg shadow-sm">
              <XCircle className="size-5 text-destructive" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">Inactivos</span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold tracking-tighter text-foreground">{inactives}</span>
            <span className="text-sm text-muted-foreground font-medium">Acceso revocado</span>
          </div>
        </div>
      </div>

      {/* Desglose por área */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <ChefHat className="size-4 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cocina</p>
            <p className="text-xl font-bold text-foreground">{enCocina}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <GlassWater className="size-4 text-purple-700 dark:text-purple-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Barra</p>
            <p className="text-xl font-bold text-foreground">{enBarra}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Calendar className="size-4 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cajeros</p>
            <p className="text-xl font-bold text-foreground">{cajeros}</p>
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="bg-card shadow-sm rounded-3xl p-8 pt-6">
        <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
          <h3 className="text-lg font-bold text-foreground">Directorio de Empleados</h3>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Cargando...</p>
        ) : null}

        {!isLoading && data && data.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
              <div className="col-span-4">Personal</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Rol</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-1 text-right">Editar</div>
            </div>

            <div className="flex flex-col">
              {data.map((user) => {
                const isEditing = editingId === user.id;

                return isEditing ? (
                  <div
                    key={user.id}
                    className="p-4 border-b border-border/40 bg-secondary/20 rounded-xl my-2"
                  >
                    <form
                      className="flex gap-4 items-center w-full"
                      onSubmit={(event) => handleUpdate(event, user.id)}
                    >
                      <div className="flex-1">
                        <select
                          name="role"
                          className="h-10 w-full rounded-xl bg-background border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
                          defaultValue={user.role}
                        >
                          <option value="admin">Administrador</option>
                          <option value="cajero">Cajero</option>
                          <option value="cocina">Cocina</option>
                          <option value="barra">Barra</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          name="active"
                          type="checkbox"
                          defaultChecked={user.active}
                          className="size-4 accent-primary"
                        />
                        Usuario activo
                      </label>
                      <div className="flex items-center gap-2">
                        <Button size="sm" type="submit" disabled={isPending}>
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-4 items-center py-4 px-4 border-b border-border/40 hover:bg-secondary/20 transition-colors rounded-xl group"
                  >
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="size-10 rounded-full bg-slate-900 dark:bg-slate-700 border border-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <UserRound className="size-5" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-[14.5px] text-foreground truncate">
                          {user.full_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          Desde {formatRegisteredDate(user.invited_at, user.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 text-[13px] text-muted-foreground truncate">
                      {user.email}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${rolePillColors[user.role] ?? rolePillColors["cajero"]}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user.id, user.role, user.active)}
                        disabled={isPending}
                        aria-label={user.active ? "Desactivar usuario" : "Activar usuario"}
                        className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${
                          user.active ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`absolute top-1 size-4 bg-white rounded-full transition-transform shadow-sm ${
                            user.active ? "translate-x-[22px]" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="col-span-1 flex justify-end gap-3 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(user.id)}
                        className="hover:text-foreground"
                        title="Editar usuario"
                      >
                        <Pencil className="size-[18px]" />
                      </button>
                      <button
                        className="hover:text-destructive"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="size-[18px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted-foreground uppercase pt-6 px-4">
              <span>Mostrando {data.length} miembros del personal</span>
            </div>
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            No hay miembros del staff registrados aún.
          </p>
        )}
      </div>
    </div>
  );
}
