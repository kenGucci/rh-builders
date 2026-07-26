import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createToken } from "@/lib/auth";
import { supabaseConfigured, getSupabase } from "@/lib/supabase";
import { createUser, findUserByEmail } from "@/lib/users";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/auth?error=missing_params", request.url)
    );
  }

  const stateCookie = request.cookies.get("x_oauth_state")?.value;
  if (!stateCookie) {
    return NextResponse.redirect(
      new URL("/auth?error=no_state_cookie", request.url)
    );
  }

  let parsed: { state: string; code_verifier: string };
  try {
    parsed = JSON.parse(stateCookie);
  } catch {
    return NextResponse.redirect(
      new URL("/auth?error=invalid_state_cookie", request.url)
    );
  }

  if (parsed.state !== state) {
    return NextResponse.redirect(
      new URL("/auth?error=state_mismatch", request.url)
    );
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/auth?error=x_not_configured", request.url)
    );
  }

  try {
    const tokenRes = await fetch(
      "https://api.twitter.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: parsed.code_verifier,
        }).toString(),
      }
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/auth?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    const userRes = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/auth?error=user_fetch_failed", request.url)
      );
    }

    const { data: xUser } = await userRes.json();
    const xUsername = xUser.username as string;
    const xName = xUser.name as string;
    const xId = xUser.id as string;
    const email = `${xUsername}@x.generated`;

    let userId: string;
    let userName: string;
    let userEmail: string;

    if (supabaseConfigured) {
      const supabase = getSupabase();
      if (!supabase) {
        return NextResponse.redirect(
          new URL("/auth?error=supabase_init_failed", request.url)
        );
      }

      const { data: existingUsers } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("provider", "x")
        .eq("x_handle", xUsername)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        const existing = existingUsers[0];
        userId = existing.id;
        userName = existing.name;
        userEmail = existing.email;
      } else {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            email,
            name: xName,
            provider: "x",
            x_handle: xUsername,
            x_id: xId,
          })
          .select("id, email, name")
          .single();

        if (createError || !newUser) {
          return NextResponse.redirect(
            new URL("/auth?error=user_create_failed", request.url)
          );
        }

        userId = newUser.id;
        userName = newUser.name;
        userEmail = newUser.email;
      }
    } else {
      let localUser = findUserByEmail(email);
      if (!localUser) {
        const newUser = createUser(
          email,
          randomPassword(),
          xName,
          "x",
          xUsername
        );
        if (!newUser) {
          return NextResponse.redirect(
            new URL("/auth?error=user_create_failed", request.url)
          );
        }
        localUser = newUser;
      }

      userId = localUser.id;
      userName = localUser.name;
      userEmail = localUser.email;
    }

    const jwtToken = await createToken({
      userId,
      email: userEmail,
      name: userName,
      provider: "x",
    });

    const searchParamsFromReq = new URL(request.url).searchParams;
    const redirectTo = searchParamsFromReq.get("from") || "/";

    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    response.cookies.set("gambo_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("x_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/x/callback] Failed:", err);
    return NextResponse.redirect(
      new URL("/auth?error=x_login_failed", request.url)
    );
  }
}

function randomPassword(): string {
  return randomBytes(32).toString("hex");
}
