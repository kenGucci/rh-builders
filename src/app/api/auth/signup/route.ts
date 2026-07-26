import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";
import { createUser } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, provider, xHandle } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (error) {
        const message =
          error.message.includes("already")
            ? "An account with this email already exists"
            : error.message;
        return NextResponse.json({ error: message }, { status: 409 });
      }

      if (!data.user) {
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }

      await supabase.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email || email,
          name: name.trim(),
          provider: provider === "x" ? "x" : "email",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      const token = await createToken({
        userId: data.user.id,
        email: data.user.email || email,
        name: name.trim(),
        provider: provider === "x" ? "x" : "email",
      });

      const response = NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
          provider: provider === "x" ? "x" : "email",
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

    const user = createUser(
      email.trim(),
      password,
      name.trim(),
      provider === "x" ? "x" : "email",
      xHandle || undefined
    );

    if (!user) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
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
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
