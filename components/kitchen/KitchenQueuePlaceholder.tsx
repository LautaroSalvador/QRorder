import { ChefHat, Clock3, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KitchenQueuePlaceholderProps = {
  title: string;
  description: string;
  area: "cocina" | "barra";
};

export function KitchenQueuePlaceholder({
  title,
  description,
  area,
}: KitchenQueuePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-3">
            Staff · {area}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { icon: ListChecks, label: "Pendientes" },
          { icon: ChefHat, label: "En preparación" },
          { icon: Clock3, label: "Listos" },
        ].map(({ icon: Icon, label }) => (
          <Card key={label} className="min-h-72">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Icon className="size-5 text-primary" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-muted-surface p-4 text-sm text-muted-foreground">
                Cola preparada para el polling de 5 segundos que llega en Fase 3.
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
