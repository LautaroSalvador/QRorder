"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, Pencil, Trash2, Shield, Calendar, CheckCircle2, XCircle, ArrowRightCircle, UserRound, Filter, Download, UserPlus, X } from "lucide-react";
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

  const total = data?.length || 0;
  const actives = data?.filter(u => u.active).length || 0;
  const inactives = total - actives;
  const cooking = data?.filter(u => u.role === "cocina" && u.active).length || 0;

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
          setIsAdding(false);
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

  function handleToggleActive(userId: string, currentRole: string, currentStatus: boolean) {
    startTransition(() => {
      void (async () => {
        try {
          await fetchJson<StaffUser>(`/api/staff/admin/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role: currentRole,
              active: !currentStatus,
            }),
          });
          await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey });
        } catch {
          console.error("Failed to toggle status");
        }
      })();
    });
  }

  const rolePillColors: Record<string, string> = {
    admin: "bg-[#fbeadb] text-[#c14418]",
    cajero: "bg-secondary text-foreground",
    cocina: "bg-blue-100/50 text-blue-600",
    barra: "bg-purple-100/50 text-purple-600"
  };

  return (
    <div className="space-y-8 pb-12 relative pt-2">
      <div className="absolute right-0 -top-[4.5rem]">
         <Button onClick={() => setIsAdding(!isAdding)} className="h-11 px-6 rounded-xl font-medium shadow-md shadow-primary/20">
            {isAdding ? <X className="size-5 mr-1" /> : <UserPlus className="size-5 mr-1.5" />}
            {isAdding ? "Cancelar" : "Añadir Miembro"}
         </Button>
      </div>

      {isAdding && (
         <div className="bg-card shadow-sm rounded-3xl p-8 mb-8 border border-border/40 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold mb-6">Invitar Nuevo Miembro</h3>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nombre completo</label>
                <Input name="fullName" placeholder="Ej: Ana Pérez" required className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Email</label>
                <Input name="email" type="email" placeholder="ana@mesaqr.com" required className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Rol asignado</label>
                <div className="relative">
                   <select name="role" className="appearance-none h-12 w-full rounded-xl bg-secondary/30 border-transparent px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" defaultValue="cajero">
                      <option value="admin">Administrador</option>
                      <option value="cajero">Cajero</option>
                      <option value="cocina">Cocina</option>
                      <option value="barra">Barra</option>
                   </select>
                </div>
              </div>
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={isPending}>
                <MailPlus className="size-5 mr-2" />
                Enviar Invitación
              </Button>
            </form>
         </div>
      )}

      {feedback ? (
          <p className={`text-sm font-medium p-3 rounded-lg ${feedback.kind === "error" ? "text-destructive bg-destructive/10" : "text-green-700 bg-green-500/10"}`}>
            {feedback.message}
          </p>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
               <div className="bg-card p-2 rounded-lg shadow-sm"><UserRound className="size-5 text-primary" /></div>
               <span className="text-[11px] font-bold uppercase tracking-widest">Total Staff</span>
            </div>
            <div className="flex flex-col">
               <span className="text-4xl font-bold tracking-tighter text-foreground">{total}</span>
               <span className="text-sm text-green-600 font-medium">+1 este mes</span>
            </div>
         </div>
         <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
               <div className="bg-card p-2 rounded-lg shadow-sm"><CheckCircle2 className="size-5 text-green-600" /></div>
               <span className="text-[11px] font-bold uppercase tracking-widest">Activos</span>
            </div>
            <div className="flex flex-col">
               <span className="text-4xl font-bold tracking-tighter text-foreground">{actives}</span>
               <span className="text-sm text-muted-foreground font-medium">Con acceso al sistema</span>
            </div>
         </div>
         <div className="border border-primary/20 bg-primary/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary"></div>
            <div className="flex items-center gap-3 text-primary mb-4">
               <div className="bg-card p-2 rounded-lg shadow-sm"><ArrowRightCircle className="size-5 text-primary" /></div>
               <span className="text-[11px] font-bold uppercase tracking-widest">Cocinando</span>
            </div>
            <div className="flex flex-col">
               <span className="text-4xl font-bold tracking-tighter text-foreground">{cooking}</span>
               <span className="text-sm text-primary font-medium">Brigada activa</span>
            </div>
         </div>
         <div className="bg-secondary/40 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
               <div className="bg-card p-2 rounded-lg shadow-sm"><XCircle className="size-5 text-destructive" /></div>
               <span className="text-[11px] font-bold uppercase tracking-widest">Inactivos</span>
            </div>
            <div className="flex flex-col">
               <span className="text-4xl font-bold tracking-tighter text-foreground">{inactives}</span>
               <span className="text-sm text-muted-foreground font-medium">Acceso revocado</span>
            </div>
         </div>
      </div>

      {/* Directory Box */}
      <div className="bg-card shadow-sm rounded-3xl p-8 pt-6">
         <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
            <h3 className="text-lg font-bold text-foreground">Directorio de Empleados</h3>
            <div className="flex gap-4 text-muted-foreground">
               <button className="hover:text-foreground transition-colors"><Filter className="size-5" /></button>
               <button className="hover:text-foreground transition-colors"><Download className="size-5" /></button>
            </div>
         </div>

         {isLoading ? <p className="text-sm text-muted-foreground py-10 text-center">Cargando...</p> : null}
         
         {!isLoading && data && data.length > 0 && (
            <div className="w-full">
               <div className="grid grid-cols-12 gap-4 pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
                  <div className="col-span-4">Personal</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Rol</div>
                  <div className="col-span-2 text-center">Estado</div>
                  <div className="col-span-1 text-right">Acciones</div>
               </div>
               
               <div className="flex flex-col">
                  {data.map((user) => {
                     const isEditing = editingId === user.id;

                     return isEditing ? (
                        <div key={user.id} className="p-4 border-b border-border/40 bg-secondary/20 rounded-xl my-2">
                           <form className="flex gap-4 items-center w-full" onSubmit={(event) => handleUpdate(event, user.id)}>
                              <div className="flex-1 space-y-1">
                                 <select name="role" className="h-10 w-full rounded-xl bg-background border px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50" defaultValue={user.role}>
                                    <option value="admin">Admin</option>
                                    <option value="cajero">Cajero</option>
                                    <option value="cocina">Cocina</option>
                                    <option value="barra">Barra</option>
                                 </select>
                              </div>
                              <div className="flex-1 flex items-center gap-2 text-sm text-foreground">
                                 <input name="active" type="checkbox" defaultChecked={user.active} className="size-4" />
                                 Usuario activo
                              </div>
                              <div className="flex items-center gap-2">
                                 <Button size="sm" type="submit" disabled={isPending}>Guardar</Button>
                                 <Button size="sm" variant="outline" type="button" onClick={() => setEditingId(null)}>Cerrar</Button>
                              </div>
                           </form>
                        </div>
                     ) : (
                        <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-4 px-4 border-b border-border/40 hover:bg-secondary/20 transition-colors rounded-xl group">
                           <div className="col-span-4 flex items-center gap-4">
                              <div className="size-10 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <UserRound className="size-5" />
                              </div>
                              <div className="flex flex-col truncate">
                                 <span className="font-bold text-[14.5px] text-foreground truncate">{user.full_name}</span>
                                 <span className="text-[11px] text-muted-foreground truncate">Registrado {user.invited_at ? new Date(user.invited_at).toLocaleDateString() : 'hace tiempo'}</span>
                              </div>
                           </div>
                           <div className="col-span-3 text-[13px] text-muted-foreground truncate">
                              {user.email}
                           </div>
                           <div className="col-span-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${rolePillColors[user.role] || rolePillColors['cajero']}`}>
                                 {user.role}
                              </span>
                           </div>
                           <div className="col-span-2 flex justify-center">
                              <button 
                                 type="button" 
                                 onClick={() => handleToggleActive(user.id, user.role, user.active)}
                                 className={`w-11 h-6 rounded-full relative transition-colors ${user.active ? 'bg-primary shadow-inner' : 'bg-muted-foreground/30'}`}
                              >
                                 <div className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${user.active ? 'right-1' : 'left-1'}`} />
                              </button>
                           </div>
                           <div className="col-span-1 flex justify-end gap-3 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingId(user.id)} className="hover:text-foreground"><Pencil className="size-[18px]" /></button>
                              <button className="hover:text-destructive"><Trash2 className="size-[18px]" /></button>
                           </div>
                        </div>
                     )
                  })}
               </div>
               
               <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted-foreground uppercase pt-6 px-4">
                  <span>Mostrando {data.length} miembros del personal</span>
               </div>
            </div>
         )}
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
         <div className="bg-[#fbeadb]/50 rounded-3xl p-6 flex flex-col gap-3 relative">
            <div className="size-10 rounded-xl bg-[#c14418] flex items-center justify-center text-white shadow-sm mb-1">
               <Shield className="size-5" />
            </div>
            <h4 className="text-[15px] font-bold text-[#a83b14]">Niveles de Permisos</h4>
            <p className="text-[13px] leading-relaxed text-[#c14418]/80 pr-4">Asegúrate de asignar los roles correctamente. Los administradores tienen acceso total, mientras que el personal de Cocina y Bar solo puede gestionar comandas específicas.</p>
         </div>

         <div className="bg-blue-500/5 rounded-3xl p-6 flex flex-col gap-3 relative">
            <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm mb-1">
               <Calendar className="size-5" />
            </div>
            <h4 className="text-[15px] font-bold text-blue-900">Control de Turnos</h4>
            <p className="text-[13px] leading-relaxed text-blue-800/80 pr-4">Al desactivar un usuario, este perderá acceso instantáneo a la terminal, pero sus registros históricos y auditorías se mantendrán intactos en la base de datos.</p>
         </div>
      </div>
    </div>
  );
}
