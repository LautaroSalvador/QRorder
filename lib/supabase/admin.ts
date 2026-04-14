import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let adminClient: SupabaseClient<Database> | null = null;

export function supabaseAdmin() {
  if (!adminClient) {
    const {
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    } = getSupabaseAdminEnv();

    adminClient = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
