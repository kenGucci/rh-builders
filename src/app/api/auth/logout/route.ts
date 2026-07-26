import { NextResponse } from "next/server";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";

export async function POST() {
  if (supabaseConfigured) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("gambo_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
