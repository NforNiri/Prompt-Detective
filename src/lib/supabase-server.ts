import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The only module that touches the service role key. Import it from route handlers only.

if (typeof window !== "undefined") {
  throw new Error("supabase-server was imported in the browser. It must only run in route handlers.");
}

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
