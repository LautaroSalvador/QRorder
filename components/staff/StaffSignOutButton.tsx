import { redirect } from "next/navigation";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StaffSignOutButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  children?: React.ReactNode;
};

async function signOutAction() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/staff/login");
}

export function StaffSignOutButton({
  className,
  variant = "outline",
  children,
}: StaffSignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} className={className}>
        {children || (
          <>
            <LogOut className="size-4" />
            Cerrar sesión
          </>
        )}
      </Button>
    </form>
  );
}
