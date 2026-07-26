import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function generateRandomString(length: number): string {
  let result = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !redirectUri || clientId === "your_x_client_id_here") {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("error", "X (Twitter) login is not configured. Please set X_CLIENT_ID and X_CLIENT_SECRET in .env.local with your X Developer app credentials.");
    return NextResponse.redirect(authUrl);
  }

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);

  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const response = NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20users.read%20follows.read%20offline.access&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`
  );

  response.cookies.set(
    "x_oauth_state",
    JSON.stringify({ state, code_verifier: codeVerifier }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    }
  );

  return response;
}
