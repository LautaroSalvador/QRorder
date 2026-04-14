import { FileCog, LayoutPanelTop, UtensilsCrossed, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminSetupCardProps = {
  title: string;
  description: string;
};

export function AdminSetupCard({
  title,
  description,
}: AdminSetupCardProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div>
        <Badge variant="secondary" className="mb-3">
          Staff · admin
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: UtensilsCrossed,
            title: "Menú",
            text: "CRUD de categorías e ítems con Supabase Storage.",
          },
          {
            icon: LayoutPanelTop,
            title: "Mesas",
            text: "Base lista para layout visual, QR y reseteo de sesión.",
          },
          {
            icon: Users,
            title: "Usuarios",
            text: "Gestión de roles staff conectada a Supabase Auth.",
          },
          {
            icon: FileCog,
            title: "Configuración",
            text: "Preparada para credenciales MP, propinas y sonidos.",
          },
        ].map(({ icon: Icon, text, title: cardTitle }) => (
          <Card key={cardTitle}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Icon className="size-5 text-primary" />
                {cardTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {text}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
