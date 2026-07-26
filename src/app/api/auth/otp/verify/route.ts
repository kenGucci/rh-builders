import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { createToken } from "@/lib/auth";
import { findUserByEmail, createUser } from "@/lib/users";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, name } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();

    const result = verifyOTP(normalised, code);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (supabaseConfigured) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: existingUsers, error: queryError } = await supabase
          .from("users")
          .select("id, email, name, provider")
          .eq("email", normalised)
          .limit(1);

        if (!queryError && existingUsers && existingUsers.length > 0) {
          const user = existingUsers[0];
          const token = await createToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider || "email",
          });

          const response = NextResponse.json({
            user: { id: user.id, email: user.email, name: user.name, provider: user.provider },
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

        if (!queryError) {
          const userName = name?.trim() || normalised.split("@")[0];
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              email: normalised,
              name: userName,
              provider: "email",
              created_at: new Date().toISOString(),
            })
            .select("id, email, name, provider")
            .single();

          if (!createError && newUser) {
            const token = await createToken({
              userId: newUser.id,
              email: newUser.email,
              name: newUser.name,
              provider: "email",
            });

            const response = NextResponse.json({
              user: { id: newUser.id, email: newUser.email, name: newUser.name, provider: "email" },
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
        }

        // Supabase users table missing or errored — fall through to local storage
      }
    }

    let localUser = findUserByEmail(normalised);

    if (!localUser) {
      const userName = name?.trim() || normalised.split("@")[0];
      const randomPassword = randomBytes(32).toString("hex");
      localUser = createUser(normalised, randomPassword, userName, "email");
      if (!localUser) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
    }

    const token = await createToken({
      userId: localUser.id,
      email: localUser.email,
      name: localUser.name,
      provider: localUser.provider,
    });

    const response = NextResponse.json({
      user: { id: localUser.id, email: localUser.email, name: localUser.name, provider: localUser.provider },
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
  } catch (err) {
    console.error("[otp/verify] Failed:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
