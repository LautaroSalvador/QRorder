import { QrCode, ReceiptText, Soup } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DinerSetupCardProps = {
  tableId: string;
  title: string;
  description: string;
};

export function DinerSetupCard({
  tableId,
  title,
  description,
}: DinerSetupCardProps) {
  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader className="space-y-4">
        <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
          Mesa {tableId.slice(0, 8)}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted-surface p-4">
          <QrCode className="mb-3 size-5 text-primary" />
          <p className="font-medium">Acceso por QR</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ruta pública lista para abrir sesión de mesa en Fase 2.
          </p>
        </div>
        <div className="rounded-2xl bg-muted-surface p-4">
          <Soup className="mb-3 size-5 text-primary" />
          <p className="font-medium">Pedido colaborativo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            El flujo compartido va a persistir en DB y sincronizar por polling.
          </p>
        </div>
        <div className="rounded-2xl bg-muted-surface p-4">
          <ReceiptText className="mb-3 size-5 text-primary" />
          <p className="font-medium">Pago final</p>
          <p className="mt-1 text-sm text-muted-foreground">
            La pantalla queda reservada para Checkout Pro en Fase 5.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
