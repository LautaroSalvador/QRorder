"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, UtensilsCrossed, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDinerOrder } from "@/components/diner/useDinerOrder";
import { useDinerSession } from "@/components/diner/useDinerSession";
import { fetchJson } from "@/lib/fetcher";
import { useDinerCartStore } from "@/lib/stores/diner-cart";
import type { DinerMenuCategory } from "@/lib/validations/diner";
import { dinerTableSchema } from "@/lib/validations/diner";

type DinerMenuExperienceProps = {
  categories: DinerMenuCategory[];
  table: ReturnType<typeof dinerTableSchema.parse>;
};

export function DinerMenuExperience({
  categories,
  table,
}: DinerMenuExperienceProps) {
  const { data: sessionData, isLoading: isSessionLoading } = useDinerSession(table.id);
  const orderQuery = useDinerOrder(Boolean(sessionData), table.id);
  const {
    closeItemDialog,
    isItemDialogOpen,
    items,
    openItemDialog,
    selectedItem,
    setOrderSnapshot,
  } = useDinerCartStore();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (orderQuery.data) {
      setOrderSnapshot(orderQuery.data);
    }
  }, [orderQuery.data, setOrderSnapshot]);

  useEffect(() => {
    if (selectedItem) {
      setQty(1);
      setNotes("");
      setSubmitError(null);
    }
  }, [selectedItem]);

  const cartCount = useMemo(
    () =>
      items
        .filter((item) => item.status === "cart")
        .reduce((accumulator, item) => accumulator + item.qty, 0),
    [items],
  );

  const subtotalLive = items.filter(i => i.status !== "cart").reduce((acc, item) => acc + item.priceSnapshot * item.qty, 0);
  const subtotalCart = items.filter(i => i.status === "cart").reduce((acc, item) => acc + item.priceSnapshot * item.qty, 0);
  const subtotal = subtotalLive + subtotalCart;
  const isDialogActive = isItemDialogOpen && selectedItem !== null;

  const selectedItemCategory = useMemo(() => {
    if (!selectedItem) return null;
    return categories.find(c => c.items.some(i => i.id === selectedItem.id));
  }, [categories, selectedItem]);

  const isDrink = useMemo(() => {
    if (!selectedItemCategory) return false;
    const name = selectedItemCategory.name.toLowerCase();
    return name.includes("bebida") || name.includes("trago") || name.includes("cafetería") || name.includes("vino") || name.includes("cerveza");
  }, [selectedItemCategory]);

  async function performAddItem(menuItemId: string, finalQty: number, finalNotes: string) {
    await fetchJson("/api/diner/order/items", {
      body: JSON.stringify({
        menuItemId,
        notes: finalNotes,
        qty: finalQty,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    await orderQuery.refetch();
  }

  async function handleAddItem() {
    if (!selectedItem) return;

    setIsAddingItem(true);
    setSubmitError(null);

    try {
      await performAddItem(selectedItem.id, qty, notes);
      closeItemDialog();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No pudimos agregar el ítem.",
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleQuickAdd(e: React.MouseEvent, item: DinerMenuCategory["items"][number]) {
    e.stopPropagation();
    if (!sessionData) return;
    
    setQuickAddingId(item.id);
    try {
      await performAddItem(item.id, 1, "");
    } catch (error) {
      alert("Error sumando ítem." + (error instanceof Error ? error.message : ""));
    } finally {
      setQuickAddingId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background relative pb-28 selection:bg-primary/20">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[35vh] bg-gradient-to-b from-[#fbeadb]/40 to-transparent -z-10 pointer-events-none" />

      {/* Top section - Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 relative z-20">
        <div className="flex items-center gap-3">
          <div className="text-primary font-bold">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{table.name}</h1>
        </div>
        <div className="bg-secondary/60 text-muted-foreground px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide shrink-0">
          Mesa {table.number}
        </div>
      </header>
      
      {/* Scrollable Categories Sticky Nav */}
      <div className="sticky top-0 bg-background/90 backdrop-blur-xl z-20 border-b border-border/40 py-3 mt-2 shadow-sm">
         <div className="flex px-5 overflow-x-auto gap-4 scrollbar-hide no-scrollbar items-center">
            {categories.map((category) => (
               <a 
                  key={`nav-${category.id}`} 
                  href={`#category-${category.id}`}
                  className="whitespace-nowrap px-4 py-1.5 rounded-full border border-border/50 text-[13px] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
               >
                  {category.name}
               </a>
            ))}
         </div>
      </div>

      {/* Welcome text */}
      <section className="px-6 mt-6 mb-2 flex items-center justify-between">
         <div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-foreground leading-tight">What are you <br/>craving today?</h2>
         </div>
      </section>

      {/* Categories Content */}
      <div className="flex-1 px-4 mt-4 space-y-10">
         {categories.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground italic">Menú no disponible por el momento.</div>
         ) : null}

         {categories.map((category) => (
            <section key={category.id} id={`category-${category.id}`} className="space-y-4 pt-16 -mt-16">
               <div className="flex items-center gap-2 px-2">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{category.name}</h3>
                  <div className="flex-1 h-px bg-border/60 ml-4"></div>
               </div>
               
               <div className="grid grid-cols-1 gap-5">
                  {category.items.map((item) => (
                     <div 
                        key={item.id} 
                        onClick={() => sessionData && openItemDialog(item)}
                        className={`bg-card rounded-[1.75rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-border/30 transition-transform ${sessionData ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.98]' : 'opacity-75 grayscale-[0.2]'}`}
                     >
                        <div className="shrink-0 w-full h-44 bg-muted-surface relative">
                           {item.imageUrl ? (
                              <div className="w-full h-full bg-cover bg-center transition-transform hover:scale-105 duration-1000" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-muted-foreground/30"><UtensilsCrossed className="size-10" /></div>
                           )}
                           <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-sm font-bold text-foreground">
                              ${item.price.toFixed(2)}
                           </div>
                        </div>
                        <div className="p-5 flex flex-col justify-between">
                           <div className="space-y-2">
                              <h4 className="text-[17px] font-bold text-foreground leading-tight pr-4">{item.name}</h4>
                              <p className="text-[13.5px] text-muted-foreground leading-snug line-clamp-2">{item.description}</p>
                           </div>
                           <div className="mt-4 flex items-center justify-between">
                              <button 
                                 onClick={(e) => handleQuickAdd(e, item)}
                                 disabled={quickAddingId === item.id || !sessionData}
                                 className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1.5 pt-1.5 rounded-md flex items-center gap-1.5 hover:bg-primary hover:text-white transition-colors"
                              >
                                 <Plus className="size-3" /> {quickAddingId === item.id ? "Añadiendo..." : "Añadir"}
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         ))}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-10 flex items-center gap-4 bg-card shadow-[0_-2px_20px_rgba(0,0,0,0.06)] rounded-[1.75rem] p-3 animate-in slide-in-from-bottom-12 duration-500">
         <div className="flex-1 flex flex-col justify-center px-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
            <span className="text-xl font-black text-foreground tracking-tight">${subtotal.toFixed(2)}</span>
         </div>
         
         <Link href={`/t/${table.id}/order`} className="flex-1">
            <div className="bg-primary hover:bg-[#a83b14] active:scale-[0.98] transition-all h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold shadow-md shadow-primary/20 w-full relative">
               <ShoppingBag className="size-5" /> 
               <span>View Order</span>
               {cartCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-foreground text-background size-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ring-2 ring-card animate-in zoom-in">
                     {cartCount}
                  </div>
               )}
            </div>
         </Link>
      </div>

      {/* Add Item Dialog overlay */}
      {isDialogActive && selectedItem && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity" onClick={closeItemDialog} />
            
            {/* Modal */}
            <div className="bg-card w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom-1/2 zoom-in-95 duration-300">
               {/* Modal Header Image */}
               <div className="w-full h-48 sm:h-56 bg-secondary/30 relative">
                  {selectedItem.imageUrl ? (
                     <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${selectedItem.imageUrl})` }} />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><UtensilsCrossed className="size-12" /></div>
                  )}
                  {/* Close pill */}
                  <button onClick={closeItemDialog} className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white rounded-full size-8 flex items-center justify-center hover:bg-black/60 transition-colors">
                     <Minus className="size-5 rotate-45" />
                  </button>
               </div>

               <div className="p-6 sm:p-8 flex flex-col gap-6">
                  {/* Title & Price */}
                  <div className="flex justify-between flex-col gap-2">
                     <h2 className="text-[22px] font-black leading-tight text-foreground">{selectedItem.name}</h2>
                     <div className="flex items-center gap-3">
                        <span className="text-[22px] font-bold text-primary">${selectedItem.price.toFixed(2)}</span>
                     </div>
                  </div>

                  <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                    {selectedItem.description}
                  </p>

                  <hr className="border-border/50" />

                  {/* Options */}
                  <div className="space-y-6">
                     {!isDrink && (
                        <div>
                           <label className="text-[11px] font-bold tracking-widest uppercase text-foreground mb-2 block">Aclaraciones</label>
                           <textarea 
                              className="w-full bg-secondary/40 border-transparent rounded-xl p-4 text-[14px] min-h-[5rem] focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                              placeholder="Sin cebolla, aderezo extra, etc."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              maxLength={200}
                           />
                        </div>
                     )}

                     <div className="flex items-center justify-between mt-2">
                        <label className="text-[11px] font-bold tracking-widest uppercase text-foreground">Cantidad</label>
                        <div className="flex items-center gap-4 bg-secondary/40 rounded-full p-1.5 px-2 shadow-inner">
                           <button onClick={() => setQty(Math.max(1, qty - 1))} className="size-8 rounded-full bg-background shadow-sm flex items-center justify-center hover:bg-secondary transition-colors text-foreground disabled:opacity-50" disabled={qty <= 1}>
                              <Minus className="size-4" />
                           </button>
                           <span className="font-bold text-[17px] w-6 text-center">{qty}</span>
                           <button onClick={() => setQty(Math.min(99, qty + 1))} className="size-8 rounded-full bg-background shadow-sm flex items-center justify-center hover:bg-secondary transition-colors text-foreground">
                              <Plus className="size-4" />
                           </button>
                        </div>
                     </div>
                  </div>

                  {submitError && <p className="text-sm text-destructive font-bold text-center mt-2">{submitError}</p>}

                  {/* Add Button */}
                  <button 
                     onClick={() => void handleAddItem()}
                     disabled={isAddingItem}
                     className="mt-6 w-full bg-primary hover:bg-[#a83b14] active:scale-[0.98] transition-all h-14 rounded-[1.25rem] flex items-center justify-center gap-2 text-white font-bold text-[16px] shadow-lg shadow-primary/25"
                  >
                     {isAddingItem ? "Agregando..." : `Añadir ${(selectedItem.price * qty).toFixed(2)}`}
                     {!isAddingItem && <Sparkles className="size-4 ml-1 opacity-70" />}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
