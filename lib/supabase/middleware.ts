import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseClientEnv } from "@/lib/env";

function createRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();

  url.pathname = pathname;

  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getSupabaseClientEnv();

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const isStaffRoute = request.nextUrl.pathname.startsWith("/staff");
  const isLoginRoute = request.nextUrl.pathname === "/staff/login";

  if (isStaffRoute && !isLoginRoute && !claims) {
    const redirectResponse = createRedirect(request, "/staff/login");

    redirectResponse.cookies.set("mesaqr_next", request.nextUrl.pathname, {
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return redirectResponse;
  }

  if (isLoginRoute && claims) {
    return createRedirect(request, "/staff/cashier");
  }

  return response;
}
