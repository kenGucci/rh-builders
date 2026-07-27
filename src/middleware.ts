import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;
const API_RATE_LIMIT_MAX = 30;

const PUBLIC_PATHS = ["/auth", "/api/auth/login", "/api/auth/x/login", "/api/auth/x/callback", "/api/auth/me"];

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  return ip;
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    if (rateLimitMap.size > 10000) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }
    return true;
  }

  entry.count++;
  if (entry.count > max) return false;
  return true;
}

function sanitizePath(pathname: string): string {
  return pathname.replace(/[<>'"]/g, "");
}

function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Robots-Tag", "index, follow");

  const isDev = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const origin = isDev ? request.nextUrl.origin : "https://gamborh.xyz";

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob: https://pbs.twimg.com https://abs.twimg.com https://robinhoodchain.blockscout.com https://en.wikipedia.org https://upload.wikimedia.org https://i.ytimg.com https://*.ytimg.com",
    "font-src 'self'",
    "connect-src 'self' https://robinhoodchain.blockscout.com https://rpc.mainnet.chain.robinhood.com https://financialmodelingprep.com https://eth.blockscout.com https://polygon.blockscout.com https://arbitrum.blockscout.com https://optimism.blockscout.com https://base.blockscout.com https://bsc.blockscout.com https://publish.twitter.com https://api.twitter.com https://api.duckduckgo.com https://html.duckduckgo.com https://en.wikipedia.org https://news.google.com https://nominatim.openstreetmap.org https://vid.puffyan.us https://inv.nadeko.net https://www.youtube.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `upgrade-insecure-requests`,
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const cleanPath = sanitizePath(pathname);

  if (!checkRateLimit(getRateLimitKey(request), RATE_LIMIT_MAX)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
    return new NextResponse("Too Many Requests", { status: 429, headers: { "Retry-After": "60" } });
  }

  if (pathname.startsWith("/api/")) {
    if (!checkRateLimit(`api:${getRateLimitKey(request)}`, API_RATE_LIMIT_MAX)) {
      return NextResponse.json({ error: "API rate limit exceeded." }, { status: 429 });
    }
  }

  // Auth removed — all paths public

  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
