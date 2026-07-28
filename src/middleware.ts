import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60s"),
      analytics: true,
    })
  : null;

const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60s"),
      analytics: true,
    })
  : null;

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

  if (ratelimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "127.0.0.1";

    const activeLimit = pathname.startsWith("/api/") && apiRatelimit ? apiRatelimit : ratelimit;
    const limit = await activeLimit.limit(ip);

    if (!limit.success) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.reset) } }
        );
      }
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(limit.reset) },
      });
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
