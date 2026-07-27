import { getSupabaseServer } from "./supabase-server";

export interface FeedbackEntry {
  id: string;
  name: string;
  email: string;
  twitter: string;
  wallet: string;
  role: "tester" | "user";
  rating: "good" | "bad";
  page: string;
  message: string;
  browser: string;
  createdAt: string;
}

function supabaseFeedbackToEntry(row: Record<string, unknown>): FeedbackEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    twitter: (row.twitter as string) || "",
    wallet: (row.wallet as string) || "",
    role: (row.role as "tester" | "user") || "user",
    rating: row.rating as "good" | "bad",
    page: (row.page as string) || "",
    message: row.message as string,
    browser: (row.browser as string) || "",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export async function addFeedback(
  entry: Omit<FeedbackEntry, "id" | "createdAt">
): Promise<FeedbackEntry> {
  const supabase = getSupabaseServer();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const id = crypto.randomUUID();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      id,
      name: entry.name,
      email: entry.email,
      twitter: entry.twitter,
      wallet: entry.wallet,
      role: entry.role,
      rating: entry.rating,
      page: entry.page,
      message: entry.message,
      browser: entry.browser,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error("Failed to insert feedback");
  return supabaseFeedbackToEntry(data);
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  const supabase = getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(supabaseFeedbackToEntry);
}

export async function getFeedbackStats() {
  const entries = await getAllFeedback();
  const total = entries.length;
  const good = entries.filter((e) => e.rating === "good").length;
  const bad = entries.filter((e) => e.rating === "bad").length;
  const testers = entries.filter((e) => e.role === "tester").length;
  const users = entries.filter((e) => e.role === "user").length;
  const uniqueNames = new Set(entries.map((e) => e.name.toLowerCase())).size;

  const byPage: Record<string, { good: number; bad: number }> = {};
  for (const e of entries) {
    const p = e.page || "general";
    if (!byPage[p]) byPage[p] = { good: 0, bad: 0 };
    byPage[p][e.rating]++;
  }

  return { total, good, bad, testers, users, uniqueNames, byPage };
}
