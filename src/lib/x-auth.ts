import { createHash, randomBytes } from "crypto";

const X_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const X_API_URL = "https://api.twitter.com/2";

const X_SCOPES = ["tweet.read", "users.read", "offline.access"];

export function getXClientId(): string | null {
  const id = process.env.X_CLIENT_ID;
  return id && id.length > 0 ? id : null;
}

export function getXClientSecret(): string | null {
  const secret = process.env.X_CLIENT_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(48));
}

export function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash("sha256").update(verifier).digest());
}

export function buildXAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    scope: X_SCOPES.join(" "),
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTH_URL}?${params.toString()}`;
}

export async function exchangeXCode(opts: {
  code: string;
  clientId: string;
  clientSecret: string | null;
  redirectUri: string;
  codeVerifier: string;
}): Promise<string> {
  const body = new URLSearchParams({
    code: opts.code,
    grant_type: "authorization_code",
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
    client_id: opts.clientId,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (opts.clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(
      `${opts.clientId}:${opts.clientSecret}`
    ).toString("base64")}`;
  }

  const res = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const message = data.error_description || data.error || "Token exchange failed";
    throw new Error(message);
  }
  return data.access_token as string;
}

export async function fetchXUser(
  accessToken: string
): Promise<{ id: string; name: string; username: string }> {
  const res = await fetch(
    `${X_API_URL}/users/me?user.fields=name,username,profile_image_url`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.data) {
    throw new Error("Failed to fetch X user");
  }
  const u = data.data;
  return {
    id: String(u.id),
    name: String(u.name || u.username || "X User"),
    username: String(u.username || ""),
  };
}
