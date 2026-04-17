"use client";

import Link from "next/link";
import { UtensilsCrossed, Edit2, Trash2, ReceiptText, ShoppingCart, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerOrderExperienceProps = {
  table: ReturnType<typeof dinerTableSchema.parse>;
};

function statusLabel(status: string) {
  switch (status) {
    case "cart": return { label: "DRAFT", color: "bg-orange-100 text-[#c14418]" };
    case "pending": return { label: "PENDING", color: "bg-[#fbeadb] text-[#c14418]" };
    case "accepted": return { label: "ACCEPTED", color: "bg-blue-100/50 text-blue-600" };
    case "in_progress": return { label: "PREPARING", color: "bg-blue-100 text-blue-600" };
    case "ready": return { label: "READY", color: "bg-green-100/50 text-green-700" };
    case "delivered": return { label: "DELIVERED", color: "bg-green-100 text-green-700" };
    case "unavailable": return { label: "UNAVAILABLE", color: "bg-red-100 text-red-600" };
    case "cancelled": return { label: "CANCELLED", color: "bg-gray-100 text-gray-600" };
    default: return { label: status.toUpperCase(), color: "bg-gray-100 text-gray-600" };
  }
}

export function DinerOrderExperience({ table }: DinerOrderExperienceProps) {
  const { data: sessionData, isLoading: isSessionLoading } = useDinerSession(table.id);
  const orderQuery = useDinerOrder(Boolean(sessionData), table.id);
  const { items, setOrderSnapshot } = useDinerCartStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (orderQuery.data) {
      setOrderSnapshot(orderQuery.data);
    }
  }, [orderQuery.data, setOrderSnapshot]);

  const cartItems = useMemo(() => items.filter((item) => item.status === "cart"), [items]);
  const liveItems = useMemo(() => items.filter((item) => item.status !== "cart"), [items]);

  async function handleConfirmOrder() {
    setConfirming(true);
    setFeedback(null);
    try {
      await fetchJson("/api/diner/order/confirm", { method: "POST" });
      await orderQuery.refetch();
      setFeedback("Pedido confirmado y enviado a cocina.");
    } catch (error) {
       setFeedback(error instanceof Error ? error.message : "Error al confirmar pedido.");
    } finally {
      setConfirming(false);
    }
  }

  const subtotalLive = liveItems.reduce((acc, item) => acc + item.priceSnapshot * item.qty, 0);
  const subtotalCart = cartItems.reduce((acc, item) => acc + item.priceSnapshot * item.qty, 0);
  const subtotal = subtotalLive + subtotalCart;
  const serviceCharge = subtotal * 0.10; // Assuming 10% for layout purposes
  const total = subtotal + serviceCharge;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background relative pb-28">
      {/* Top section - Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="text-primary font-bold">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">The Bistro</h1>
        </div>
        <div className="bg-secondary/60 text-muted-foreground px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          Table {table.number}
        </div>
      </header>

      {/* Live Order Section */}
      <section className="px-6 mt-4">
         <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Live Order</h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confirmed Items</span>
         </div>
         <div className="flex flex-col gap-4">
            {liveItems.length === 0 ? (
               <div className="text-[13px] text-muted-foreground italic py-2">No tienes ítems confirmados aún.</div>
            ) : null}
            {liveItems.map(item => {
               const status = statusLabel(item.status);
               return (
                  <div key={item.id} className="bg-card rounded-[1.25rem] p-4 flex gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-transparent">
                     <div className="w-20 h-20 rounded-xl bg-secondary/50 shrink-0 shadow-sm relative overflow-hidden flex items-center justify-center">
                        <span className="text-muted-foreground font-bold text-xl">{item.qty}x</span>
                     </div>
                     <div className="flex flex-col w-full justify-center gap-1.5">
                        <div className="flex justify-between items-start">
                           <h3 className="font-bold text-foreground text-base leading-tight">{item.qty} {item.nameSnapshot}</h3>
                           <span className="font-semibold text-foreground">${(item.priceSnapshot * item.qty).toFixed(2)}</span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground italic leading-snug">{item.notes}</p>}
                        <div className="mt-1 flex items-center gap-1">
                           <span className={`text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                              {item.status === 'delivered' && <span className="size-1.5 rounded-full bg-green-600"></span>}
                              {item.status === 'pending' && <UtensilsCrossed className="size-2.5" />}
                              {status.label}
                           </span>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      </section>

      {/* Cart Section */}
      <section className="px-6 mt-10">
         <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">In Your Cart</h2>
            <span className="text-[10px] font-bold text-[#c14418] uppercase tracking-widest bg-orange-100 px-2.5 py-1 rounded-full">Draft</span>
         </div>
         
         <div className="bg-secondary/40 rounded-[1.5rem] p-5">
            {cartItems.length === 0 ? (
               <div className="text-[13px] text-muted-foreground italic text-center py-4">Tu carrito está vacío. <Link href={`/t/${table.id}`} className="text-primary font-bold ml-1">Ver menú</Link></div>
            ) : null}
            
            <div className="flex flex-col gap-6">
               {cartItems.map((item) => (
                  <EditableCartItem key={item.id} item={item} onRefresh={() => orderQuery.refetch()} />
               ))}
               
               {cartItems.length > 0 && (
                  <div className="border border-dashed border-border bg-card rounded-xl p-3 flex items-center gap-3 mt-2 opacity-80 pointer-events-none">
                     <div className="flex -space-x-2">
                        <div className="size-6 rounded-full bg-slate-200 border border-white"></div>
                        <div className="size-6 rounded-full bg-slate-300 border border-white"></div>
                     </div>
                     <span className="text-[11px] text-muted-foreground mr-auto">{!sessionData ? "Solo tú en esta sesión" : "Sesión compartida activa"}</span>
                  </div>
               )}
            </div>
         </div>
      </section>

      {/* Totals Section */}
      <section className="px-6 mt-10 mb-8">
         <div className="flex justify-between items-center text-[13px] text-muted-foreground font-medium mb-3">
            <span>Subtotal ({liveItems.length} confirmed, {cartItems.length} cart)</span>
            <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
         </div>
         <div className="flex justify-between items-center text-[13px] text-muted-foreground font-medium mb-6">
            <span>Service Charge (10%)</span>
            <span className="font-bold text-foreground">${serviceCharge.toFixed(2)}</span>
         </div>
         <div className="flex justify-between items-end border-t border-border/60 pt-4">
            <span className="text-xl font-bold tracking-tight">Total</span>
            <span className="text-3xl font-black text-[#c14418] tracking-tighter">${total.toFixed(2)}</span>
         </div>
         {feedback && <div className="mt-4 text-[13px] font-bold text-primary text-center">{feedback}</div>}
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-4 bg-card shadow-[0_-2px_20px_rgba(0,0,0,0.06)] rounded-[1.75rem] p-3">
         <Link href={`/t/${table.id}/pay`} className="flex-none">
           <div className="bg-secondary/60 hover:bg-secondary/90 transition-colors h-14 w-28 rounded-2xl flex items-center justify-center gap-2 text-foreground font-bold">
              <ReceiptText className="size-5" /> <span>Bill</span>
           </div>
         </Link>
         
         {cartItems.length > 0 ? (
            <button 
               disabled={confirming}
               onClick={() => void handleConfirmOrder()}
               className="flex-1 bg-primary hover:bg-[#a83b14] active:scale-[0.98] transition-all h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold shadow-md shadow-primary/20"
            >
               {confirming ? <RefreshCcw className="size-5 animate-spin" /> : <ShoppingCart className="size-5" />}
               <span>Confirm Order</span>
            </button>
         ) : (
            <Link href={`/t/${table.id}`} className="flex-1 bg-primary hover:bg-[#a83b14] active:scale-[0.98] transition-all h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold shadow-md shadow-primary/20">
               Ver el Menú
            </Link>
         )}
      </div>

    </div>
  );
}

type EditableCartItemProps = {
  item: ReturnType<typeof useDinerCartStore.getState>["items"][number];
  onRefresh: () => Promise<unknown>;
};

function EditableCartItem({ item, onRefresh }: EditableCartItemProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDelete() {
    setIsSaving(true);
    setFeedback(null);
    try {
      await fetchJson(`/api/diner/order/items/${item.id}`, { method: "DELETE" });
      await onRefresh();
    } catch (error) {
      setFeedback("No pudimos quitar el ítem.");
    } finally {
      setIsSaving(false);
    }
  }

  // Edit logic is simplified for UI clarity in this design map.
  // Real world could expand a form here or open the dialog.
  return (
    <div className="flex gap-4 items-start w-full relative">
       {isSaving && <div className="absolute inset-0 bg-white/50 z-10 rounded-xl" />}
       <div className="bg-card w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm font-bold text-primary">
          {item.qty}x
       </div>
       <div className="flex flex-col flex-1 justify-center min-h-[3.5rem] pt-1">
          <h4 className="font-bold text-foreground text-[14.5px] leading-tight">{item.nameSnapshot}</h4>
          <span className="text-muted-foreground text-[12.5px] font-medium leading-none mt-1">${(item.priceSnapshot * item.qty).toFixed(2)}</span>
       </div>
       <div className="flex items-center gap-3 h-14">
          <button className="text-muted-foreground/60 hover:text-foreground transition-colors"><Edit2 className="size-4" /></button>
          <button onClick={() => void handleDelete()} className="text-muted-foreground/60 hover:text-destructive transition-colors"><Trash2 className="size-[18px]" /></button>
       </div>
    </div>
  );
}
