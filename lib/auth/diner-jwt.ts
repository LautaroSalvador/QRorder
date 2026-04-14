import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { getDinerJwtEnv } from "@/lib/env";

export const DINER_COOKIE_NAME = "mesaqr_diner";
const DINER_TOKEN_TTL = "6h";

const dinerPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  tableId: z.string().uuid(),
  exp: z.number().int(),
  iat: z.number().int(),
});

type DinerTokenPayload = z.infer<typeof dinerPayloadSchema>;

function getJwtSecret() {
  const { DINER_JWT_SECRET } = getDinerJwtEnv();

  return new TextEncoder().encode(DINER_JWT_SECRET);
}

function getCookieValue(request: Request | NextRequest, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

export async function signDinerToken(input: {
  sessionId: string;
  tableId: string;
}) {
  const payload = dinerPayloadSchema
    .pick({
      sessionId: true,
      tableId: true,
    })
    .parse(input);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DINER_TOKEN_TTL)
    .sign(getJwtSecret());
}

export async function getDinerSession(
  request: Request | NextRequest,
): Promise<DinerTokenPayload | null> {
  const token = getCookieValue(request, DINER_COOKIE_NAME);

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const parsed = dinerPayloadSchema.safeParse(payload);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
