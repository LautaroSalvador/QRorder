"use client";

import { Loader2, Store, Settings, CreditCard, Lock, Eye, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetcher";

type AdminConfigFormProps = {
  hasAccessToken: boolean;
  mpPublicKey: string | null;
};

export function AdminConfigForm({ hasAccessToken, mpPublicKey }: AdminConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [localPublicKey, setLocalPublicKey] = useState(mpPublicKey ?? "");
  const [showToken, setShowToken] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorFeedback(null);

    try {
      const payload: Record<string, string> = {};
      if (mpAccessToken) payload.mpAccessToken = mpAccessToken;
      if (localPublicKey !== undefined) payload.mpPublicKey = localPublicKey;

      if (Object.keys(payload).length > 0) {
        await fetchJson("/api/staff/admin/config", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
      }

      router.refresh();
      setMpAccessToken("");
    } catch (error) {
      setErrorFeedback(error instanceof Error ? error.message : "Ocurrió un error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-8 pb-12" onSubmit={onSubmit}>
      {/* Fake Header Button Hack for the Global Save */}
      <div className="absolute right-6 sm:right-8 lg:right-12 top-[6.5rem]">
        <Button disabled={isSubmitting} type="submit" size="lg" className="h-11 px-6 rounded-xl font-medium shadow-md shadow-primary/20">
          {isSubmitting ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col - Identity */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-card border-none shadow-sm rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Store className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Restaurant Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Restaurant Legal Name</label>
                <Input defaultValue="The Culinary Tactile" className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4 font-medium" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Contact Email</label>
                <Input defaultValue="concierge@culinarytactile.com" className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-sm px-4" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                <Input defaultValue="+1 (555) 098-7654" className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-sm px-4" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Physical Address</label>
                <Input defaultValue="742 Evergreen Terrace, Culinary District, Metro City 10101" className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-sm px-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Flow */}
        <div className="flex flex-col gap-6">
          <div className="bg-muted-surface/40 border border-border/40 shadow-sm rounded-3xl p-8 h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600">
                <Settings className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Operational Flow</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Default Tip Suggestions</label>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm opacity-100 transition-opacity">10%</div>
                  <div className="bg-card text-foreground font-medium px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm hover:opacity-80 transition-opacity">15%</div>
                  <div className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm opacity-100 transition-opacity">20%</div>
                  <div className="bg-card text-foreground font-medium px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm hover:opacity-80 transition-opacity">25%</div>
                  <div className="border border-dashed border-border text-muted-foreground font-medium px-4 py-2 rounded-full cursor-pointer text-sm hover:bg-secondary transition-colors">Custom</div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Notification Sounds</label>
                <div className="bg-card flex items-center justify-between p-4 rounded-2xl shadow-sm cursor-pointer border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-destructive font-bold text-xl">♨</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">Kitchen Terminal</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">Chime on new ticket</span>
                    </div>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="bg-card flex items-center justify-between p-4 rounded-2xl shadow-sm cursor-pointer border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500 font-bold text-xl">🍸</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">Bar Station</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">Subtle alert for drinks</span>
                    </div>
                  </div>
                  <div className="w-10 h-6 bg-secondary-foreground/20 rounded-full relative shadow-inner">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mercado Pago Integration */}
      <div className="bg-card border-none shadow-sm rounded-3xl p-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
             <div className="bg-[#009EE3] p-2 rounded-xl text-white shadow-md shadow-[#009EE3]/20">
               <CreditCard className="size-6" />
             </div>
             <div className="flex flex-col">
               <h3 className="text-lg font-bold text-foreground tracking-tight">Mercado Pago Integration</h3>
               <p className="text-xs text-muted-foreground mt-0.5">Secure checkout for your customers.</p>
             </div>
           </div>
           <div className="bg-green-500/10 text-green-600 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider">
              {hasAccessToken ? "Active" : "Inactive"}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5" htmlFor="mpAccessToken">
              Access Token <Lock className="size-3" />
            </label>
            <div className="relative">
              <Input
                id="mpAccessToken"
                name="mpAccessToken"
                type={showToken ? "text" : "password"}
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder={hasAccessToken ? "•••••••••••••••••••••••••••••" : "APP_USR-..."}
                className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4 pr-12 font-mono tracking-wider placeholder:tracking-normal"
              />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                 <Eye className="size-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 italic mt-1.5">
              This token is encrypted at rest. Do not share it with unauthorized personnel.
            </p>
          </div>

          <div className="space-y-2">
             <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5" htmlFor="mpPublicKey">
              Public Key <GlobeIcon className="size-3" />
            </label>
            <Input
              id="mpPublicKey"
              name="mpPublicKey"
              type="text"
              value={localPublicKey}
              onChange={(e) => setLocalPublicKey(e.target.value)}
              placeholder="APP_USR-..."
              className="h-12 bg-secondary/30 border-transparent rounded-xl focus-visible:ring-primary/20 text-md px-4 font-mono text-muted-foreground"
            />
          </div>
        </div>

        {errorFeedback ? (
          <p className="text-sm font-medium text-destructive mt-4 bg-destructive/10 p-3 rounded-lg">{errorFeedback}</p>
        ) : null}

        <div className="mt-8 bg-[#feead1]/50 border border-[#f5c697] rounded-xl p-4 flex gap-4 text-[#a85a10]">
           <AlertCircle className="size-5 shrink-0 mt-0.5" />
           <div className="flex flex-col gap-1">
             <span className="text-sm font-bold tracking-tight">Configuration Note</span>
             <span className="text-xs leading-relaxed opacity-90">Integration is currently in Production Mode. Ensure your callback URLs are properly configured in the Mercado Pago developer portal to receive Webhook notifications for every order.</span>
           </div>
        </div>
      </div>

      {/* Bottom Footer block */}
      <div className="flex sm:flex-row flex-col justify-between items-center sm:items-start pt-6 border-t border-border/40 gap-4">
        <div className="flex flex-col gap-1 text-center sm:text-left">
           <span className="text-sm font-bold text-foreground">Data Management</span>
           <span className="text-xs text-muted-foreground">Export your restaurant configurations or purge transient system cache.</span>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" type="button" className="rounded-full shadow-sm text-xs font-semibold h-9 px-5 bg-secondary text-foreground hover:bg-border/60 border border-transparent">
             Export Config (JSON)
          </Button>
          <Button variant="outline" type="button" className="rounded-full shadow-sm text-xs font-semibold h-9 px-5 text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive">
             Purge Cache
          </Button>
        </div>
      </div>

      <div className="pt-16 pb-4 flex justify-center items-center gap-10 text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 w-full">
         <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> SYSTEM ONLINE
         </div>
         <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-destructive"></div> ADMIN TERMINAL V2.4.1
         </div>
         <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-border"></div> LAST BACKUP: 14M AGO
         </div>
      </div>

    </form>
  );
}

// Quick inline icon component to save an import if Globe is not exported default from lucide
function GlobeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
