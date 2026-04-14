import Link from "next/link";

import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DinerErrorStateProps = {
  message: string;
  title?: string;
};

export function DinerErrorState({
  message,
  title = "No pudimos abrir la mesa",
}: DinerErrorStateProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Volver al inicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
