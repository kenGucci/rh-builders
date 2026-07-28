import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.includes("your-project-id")) return null;

  const key = serviceKey || anonKey;
  if (!key) return null;

  return createClient(url, key);
}
