import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import React from "react";

import { errorResponse, getErrorMessage } from "@/lib/api-response";
import { requireStaffApiSession } from "@/lib/auth/staff-api";
import { getAppEnv } from "@/lib/env";
import { TableQrsDocument } from "@/lib/pdf/table-qrs-document";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireStaffApiSession(["admin"]);

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const admin = supabaseAdmin();
    const { NEXT_PUBLIC_APP_URL } = getAppEnv();
    const { data: tables, error } = await admin
      .from("tables")
      .select("id, name, number")
      .order("number", { ascending: true });

    if (error) {
      return errorResponse(
        "INTERNAL",
        getErrorMessage(error, "No pudimos cargar las mesas para exportar los QR."),
        500,
      );
    }

    if (!tables || tables.length === 0) {
      return errorResponse("CONFLICT", "Todavia no hay mesas para exportar.", 409);
    }

    const pages = await Promise.all(
      tables.map(async (table) => {
        const tableUrl = new URL(`/t/${table.id}`, NEXT_PUBLIC_APP_URL).toString();

        return {
          qrDataUrl: await QRCode.toDataURL(tableUrl, {
            margin: 1,
            width: 640,
          }),
          tableName: table.name,
          tableNumber: table.number,
          tableUrl,
        };
      }),
    );

    const pdfBuffer = await renderToBuffer(
      // react-pdf types expect DocumentProps but our component is a Document wrapper
      React.createElement(TableQrsDocument, { pages }) as unknown as Parameters<
        typeof renderToBuffer
      >[0],
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Disposition": 'attachment; filename="mesaqr-qrs-mesas.pdf"',
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return errorResponse(
      "INTERNAL",
      getErrorMessage(error, "No pudimos generar el PDF de QRs."),
      500,
    );
  }
}
