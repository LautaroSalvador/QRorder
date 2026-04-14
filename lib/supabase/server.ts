import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseClientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getSupabaseClientEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, options, value }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components no siempre pueden escribir cookies.
          }
        },
      },
    },
  );
}
