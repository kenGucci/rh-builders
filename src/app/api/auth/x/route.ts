import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getXClientId,
  generateCodeVerifier,
  generateCodeChallenge,
  buildXAuthorizeUrl,
} from "@/lib/x-auth";

export const runtime = "nodejs";

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const clientId = getXClientId();
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/auth?error=" + encodeURIComponent("X login is not configured yet"), request.url)
    );
  }

  const from = request.nextUrl.searchParams.get("from") || "/";
  const redirectUri = new URL("/api/auth/x/callback", request.url).toString();

  const state = base64UrlEncode(randomBytes(24));
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const cookieValue = Buffer.from(
    JSON.stringify({ v: codeVerifier, s: state, f: from })
  ).toString("base64");

  const authorizeUrl = buildXAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("x_oauth", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
