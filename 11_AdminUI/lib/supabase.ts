import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _clientUrl = "";
let _clientKey = "";

function getSupabaseServerKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseServerKey();

  if (!url || !key) {
    return null;
  }

  if (!_client || _clientUrl !== url || _clientKey !== key) {
    _client = createClient(url, key);
    _clientUrl = url;
    _clientKey = key;
  }

  return _client;
}

/** True when Supabase env vars are configured. */
export function isSupabaseConfigured(): boolean {
  return getClient() !== null;
}

/** Server-side Supabase client (service role - full access). Lazy-init. Throws if not configured. */
export function getSupabase(): SupabaseClient {
  const c = getClient();
  if (!c) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a server Supabase key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return c;
}
