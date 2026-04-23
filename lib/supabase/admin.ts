import { createClient } from "@supabase/supabase-js";

import { getSupabaseSecretKey, getSupabaseUrl, hasSupabaseAdminEnv } from "@/lib/supabase/config";

export function createAdminSupabaseClient() {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
