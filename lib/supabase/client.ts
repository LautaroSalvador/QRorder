import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseClientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } =
    getSupabaseClientEnv();

  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
