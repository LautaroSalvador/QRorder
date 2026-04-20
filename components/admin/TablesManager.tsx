"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, QrCode, Trash2, X, Users, Edit3, Grid2X2, CheckCircle2, ChevronDown, Download } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";

import { TableQRModal } from "@/components/admin/TableQRModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [qrTable, setQrTable] = useState<{ id: string; name: string; } | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data, isLoading, error } = useQuery({
    queryKey: tablesQueryKey,
    queryFn: () => fetchJson<TableRecord[]>("/api/staff/admin/tables"),
  });

  const totalCapacity = data?.reduce((acc, current) => acc + current.capacity, 0) || 0;
  const totalTables = data?.length || 0;

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
          setIsAdding(false);
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
    <div className="space-y-8 pb-12 relative pt-2">
      <div className="absolute right-0 -top-[4.5rem] flex gap-3">
         <Button asChild variant="outline" className="h-11 px-5 rounded-xl font-medium">
            <a href="/api/staff/admin/tables/qrs" target="_blank" rel="noreferrer">
              <Download className="size-4 mr-2" />
              PDF QRs
            </a>
         </Button>
         <Button onClick={() => setIsAdding(!isAdding)} className="h-11 px-6 rounded-xl font-medium shadow-md shadow-primary/20">
            {isAdding ? <X className="size-5 mr-1" /> : <Plus className="size-5 mr-1.5" />}
            {isAdding ? "Cancelar" : "Crear Mesa"}
         </Button>
      </div>

      {isAdding && (
         <div className="bg-card shadow-sm rounded-3xl p-8 mb-8 border border-border/40 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold mb-6">Agregar Nueva Mesa</h3>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Número</label>
                <Input name="number" type="number" min={1} required className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nombre Interno</label>
                <Input name="name" placeholder="Ej: Mesa 1, VIP, Barra 1" required className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Capacidad</label>
                <div className="relative">
                   <Input name="capacity" type="number" min={1} defaultValue={4} required className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4" />
                   <Users className="size-4 absolute right-4 top-4 text-muted-foreground" />
                </div>
              </div>
              <Button type="submit" className="h-12 w-full rounded-xl" disabled={isPending}>
                <CheckCircle2 className="size-5 mr-2" />
                Guardar Mesa
              </Button>
            </form>
         </div>
      )}

      {feedback ? (
          <p className={`text-sm font-medium p-3 rounded-lg ${feedback.kind === "error" ? "text-destructive bg-destructive/10" : "text-green-700 bg-green-500/10"}`}>
            {feedback.message}
          </p>
      ) : null}

      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 border-b border-border/40 pb-4">
         <div className="flex gap-6 text-sm">
            <div className="flex flex-col">
               <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-widest">Total Mesas</span>
               <span className="text-xl font-bold tracking-tight text-foreground">{totalTables}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-widest">Capacidad Max</span>
               <span className="text-xl font-bold tracking-tight text-foreground">{totalCapacity} pax</span>
            </div>
         </div>
         <div className="flex items-center gap-2 mt-4 sm:mt-0 text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50 text-[13px] font-medium cursor-pointer hover:bg-secondary/50 transition-colors">
            <Grid2X2 className="size-4" /> Disposición Visual <ChevronDown className="size-3.5" />
         </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground py-10 text-center">Cargando mesas...</p> : null}

      {!isLoading && !error && data?.length === 0 ? (
         <div className="border border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <Grid2X2 className="size-10 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-foreground">El salón está vacío</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">No hay mesas configuradas todavía. Usa el botón superior para crear la primera mesa.</p>
         </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {data?.map(table => {
            const isEditing = editingId === table.id;

            if (isEditing) {
               return (
                  <div key={table.id} className="bg-card border-2 border-primary/40 shadow-sm rounded-[1.5rem] p-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
                     <form onSubmit={(e) => handleUpdate(e, table.id)} className="flex flex-col h-full space-y-4 relative z-10">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Número</label>
                           <Input name="number" type="number" min={1} defaultValue={table.number} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre</label>
                           <Input name="name" defaultValue={table.name} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Capacidad</label>
                           <Input name="capacity" type="number" min={1} defaultValue={table.capacity} className="h-9 text-sm" />
                        </div>
                        <div className="flex gap-2 mt-auto pt-2">
                           <Button type="submit" size="sm" className="flex-1" disabled={isPending}>Guardar</Button>
                           <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)} className="px-2"><X className="size-4" /></Button>
                        </div>
                     </form>
                  </div>
               );
            }

            return (
               <div key={table.id} className="bg-card shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-border/40 rounded-[1.75rem] p-6 hover:border-primary/20 transition-all group flex flex-col min-h-[14rem]">
                  <div className="flex justify-between items-start mb-4">
                     <div className="bg-secondary/50 text-foreground font-black text-xl rounded-2xl size-12 flex items-center justify-center relative shadow-sm border border-border/50">
                        {table.number}
                     </div>
                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${table.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {table.status === 'available' ? 'Libre' : 'Ocupada'}
                     </span>
                  </div>
                  
                  <div className="mt-auto">
                     <h3 className="font-bold text-foreground text-lg tracking-tight mb-1">{table.name}</h3>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <Users className="size-4" /> {table.capacity} Personas
                     </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                     <button title="Generar QR" onClick={() => setQrTable({ id: table.id, name: table.name })} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50">
                        <QrCode className="size-4" /> QR
                     </button>
                     <div className="flex items-center gap-3 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                        <button title="Editar" onClick={() => setEditingId(table.id)} className="hover:text-foreground"><Edit3 className="size-4" /></button>
                        <button title="Eliminar" onClick={() => handleDelete(table)} className="hover:text-destructive"><Trash2 className="size-4" /></button>
                     </div>
                  </div>
               </div>
            )
         })}
      </div>

      <TableQRModal
        tableId={qrTable?.id ?? ""}
        tableName={qrTable?.name ?? ""}
        open={qrTable !== null}
        onClose={() => setQrTable(null)}
      />
    </div>
  );
}
