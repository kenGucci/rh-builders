import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";
import { authenticateUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (supabaseConfigured) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase client not available" },
          { status: 500 }
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const userName =
        (data.user.user_metadata?.name as string) ||
        email.split("@")[0];

      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email || email,
          name: userName,
          provider: "email",
        },
        { onConflict: "id" }
      );

      const token = await createToken({
        userId: data.user.id,
        email: data.user.email || email,
        name: userName,
        provider: "email",
      });

      const response = NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: userName,
          provider: "email",
        },
        token,
      });

      response.cookies.set("gambo_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
      token,
    });

    response.cookies.set("gambo_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
