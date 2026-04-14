import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { getStaffSession } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { staffLoginSchema } from "@/lib/validations/auth";

type StaffLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

async function signInAction(formData: FormData) {
  "use server";

  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    redirect(
      `/staff/login?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "No pudimos validar tus datos.",
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(
      `/staff/login?error=${encodeURIComponent(
        "Email o contraseña inválidos.",
      )}`,
    );
  }

  redirect(parsed.data.next);
}

export default async function StaffLoginPage({
  searchParams,
}: StaffLoginPageProps) {
  const session = await getStaffSession();

  if (session) {
    redirect("/staff/cashier");
  }

  const { error, next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            MesaQR · Staff
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Ingreso del equipo para cocina, barra, caja y administración.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              El acceso usa Supabase Auth con sesión SSR y protección por
              middleware sobre todas las rutas de `staff`.
            </p>
          </div>
        </section>

        <Card className="border-primary/15 bg-card/95">
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <CardDescription>
              Usá tu email y contraseña de staff para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudo iniciar sesión</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form action={signInAction} className="space-y-4">
              <input type="hidden" name="next" value={next ?? "/staff/cashier"} />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="equipo@mesaqr.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Entrar al panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
