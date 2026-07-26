import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";
import { findUserById, sanitizeUser } from "@/lib/users";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("gambo_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (supabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, name, provider, x_handle, created_at")
          .eq("id", payload.userId)
          .single();

        if (!userError && userData) {
          return NextResponse.json({
            user: {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              provider: userData.provider,
              xHandle: userData.x_handle,
              createdAt: userData.created_at,
            },
          });
        }
      }
    }

    const user = findUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("[auth/me] Failed:", err);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
