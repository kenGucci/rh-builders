import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { upsertXUser, xEmailFor } from "@/lib/users";
import {
  getXClientId,
  getXClientSecret,
  exchangeXCode,
  fetchXUser,
} from "@/lib/x-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const search = request.nextUrl;
  const errorRedirect = (message: string) =>
    NextResponse.redirect(
      new URL("/auth?error=" + encodeURIComponent(message), request.url)
    );

  const code = search.searchParams.get("code");
  const state = search.searchParams.get("state");
  const rawCookie = request.cookies.get("x_oauth")?.value;

  if (!code || !state || !rawCookie) {
    return errorRedirect("X sign-in failed or expired. Please try again.");
  }

  let cookieData: { v: string; s: string; f: string };
  try {
    cookieData = JSON.parse(Buffer.from(rawCookie, "base64").toString("utf8"));
  } catch {
    return errorRedirect("X sign-in session was invalid. Please try again.");
  }

  if (cookieData.s !== state) {
    return errorRedirect("X sign-in state mismatch. Please try again.");
  }

  const clientId = getXClientId();
  const clientSecret = getXClientSecret();
  if (!clientId || !cookieData.v) {
    return errorRedirect("X login is not configured correctly.");
  }

  try {
    const redirectUri = new URL("/api/auth/x/callback", request.url).toString();
    const accessToken = await exchangeXCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
      codeVerifier: cookieData.v,
    });

    const xUser = await fetchXUser(accessToken);
    if (!xUser.id) {
      return errorRedirect("Could not retrieve your X account.");
    }

    const user = await upsertXUser({
      xUserId: xUser.id,
      name: xUser.name,
      x_handle: xUser.username,
    });
    if (!user) {
      return errorRedirect("Failed to create your account. Please try again.");
    }

    const token = await createToken({
      userId: user.id,
      email: xEmailFor(xUser.id),
      name: user.name || xUser.name,
      provider: "x",
    });

    const redirectTo = cookieData.f || "/";
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    response.cookies.set("thewallrh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("x_oauth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/x/callback] Failed:", err);
    return errorRedirect("X sign-in failed. Please try again.");
  }
}
