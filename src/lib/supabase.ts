import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project-id"));

export function getSupabase() {
  if (!supabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
