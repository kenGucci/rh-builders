import { getSupabaseServer } from "./supabase-server";
import { hashPassword, verifyPassword } from "./auth";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  password?: string;
  walletAddress?: string;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !user || !user.password) return null;
  if (!verifyPassword(password, user.password)) return null;
  return user;
}

export async function findUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data;
}

export async function upsertUser(user: {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  role?: string;
}): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        avatar_url: user.avatar_url,
        provider: user.provider,
        role: user.role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) return null;
  return data;
}

export function sanitizeUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}

export async function linkWallet(userId: string, walletAddress: string): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .update({ walletAddress: walletAddress.toLowerCase(), updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) return null;
  return data;
}
