import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key (bypasses row-level security). Used only where a
 * browser must not be able to write, e.g. the SPO quotation log. Null when the key is not configured
 * (env `SUPABASE_SERVICE_ROLE_KEY`, in .env.local and the Vercel project — never in code or the browser).
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
