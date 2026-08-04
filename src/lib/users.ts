import { getSupabaseServer } from "./supabase-server";
import { verifyPassword, randomSecret } from "./auth";

export interface User {
  id: string;
  email: string;
  name?: string;
  x_handle?: string;
  provider?: string;
  role?: string;
  created_at?: string;
  password?: string;
  wallet_address?: string;
}

export const X_EMAIL_PREFIX = "x:";
export const X_EMAIL_DOMAIN = "@x.oauth";

export function xEmailFor(xUserId: string): string {
  return `${X_EMAIL_PREFIX}${xUserId}${X_EMAIL_DOMAIN}`;
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

export async function createUser(user: {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
}): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name || null,
      password: user.passwordHash,
      provider: "email",
    })
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function upsertXUser(user: {
  xUserId: string;
  name: string;
  x_handle: string;
}): Promise<User | null> {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: `x_${user.xUserId}`,
        email: xEmailFor(user.xUserId),
        name: user.name,
        provider: "x",
        x_handle: user.x_handle.toLowerCase().replace(/^@/, ""),
        password: randomSecret(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) return null;
  return data;
}

export function sanitizeUser(user: User) {
  const safe = { ...user };
  delete safe.password;
  return safe;
}
