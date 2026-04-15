"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TableQRModalProps = {
  tableId: string;
  tableName: string;
  open: boolean;
  onClose: () => void;
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TableQRModal({
  tableId,
  tableName,
  open,
  onClose,
}: TableQRModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tableUrl = useMemo(() => `${baseUrl}/t/${tableId}`, [tableId]);

  useEffect(() => {
    if (!open || !tableId) {
      setDataUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(tableUrl, {
          margin: 2,
          width: 256,
        });

        if (!isMounted) {
          return;
        }

        setDataUrl(qrDataUrl);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setDataUrl(null);
        setError("No pudimos generar el QR de esta mesa.");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [open, tableId, tableUrl]);

  function handleDownload() {
    if (!dataUrl) {
      return;
    }

    const link = document.createElement("a");
    const fileName = sanitizeFileName(tableName) || "mesa";

    link.href = dataUrl;
    link.download = `qr-mesa-${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>QR — {tableName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex justify-center">
            {dataUrl ? (
              <Image
                src={dataUrl}
                alt={`QR de ${tableName}`}
                className="size-64 rounded-2xl border border-border bg-white p-3"
                height={256}
                unoptimized
                width={256}
              />
            ) : (
              <div className="flex size-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
                {error ?? "Generando QR..."}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">URL de la mesa</p>
            <code className="block overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-xs text-foreground">
              {tableUrl}
            </code>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={!dataUrl}
          >
            Descargar QR
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
