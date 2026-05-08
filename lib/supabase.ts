import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _checked = false;

function getClient(): SupabaseClient | null {
  if (!_checked) {
    _checked = true;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      _client = createClient(url, key);
    }
  }
  return _client;
}

/** True when Supabase env vars are configured. */
export function isSupabaseConfigured(): boolean {
  return getClient() !== null;
}

/** Server-side Supabase client (service role — full access). Lazy-init. Throws if not configured. */
export function getSupabase(): SupabaseClient {
  const c = getClient();
  if (!c) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }
  return c;
}
