import { NextResponse } from "next/server";

import { DINER_COOKIE_NAME } from "@/lib/auth/diner-jwt";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(DINER_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
