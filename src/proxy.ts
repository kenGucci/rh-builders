import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ratelimit = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60s"), analytics: true }) : null;
const apiRatelimit = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60s"), analytics: true }) : null;

const STATIC_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://pbs.twimg.com https://abs.twimg.com https://robinhoodchain.blockscout.com https://en.wikipedia.org https://upload.wikimedia.org https://i.ytimg.com https://*.ytimg.com https://unavatar.io https://*.unavatar.io https://images.ctfassets.net https://www.google.com https://*.google.com https://s.yimg.com https://*.yimg.com",
  "font-src 'self'",
  "connect-src 'self' https://robinhoodchain.blockscout.com https://rpc.mainnet.chain.robinhood.com https://financialmodelingprep.com https://eth.blockscout.com https://polygon.blockscout.com https://arbitrum.blockscout.com https://optimism.blockscout.com https://base.blockscout.com https://bsc.blockscout.com https://publish.twitter.com https://api.twitter.com https://api.duckduckgo.com https://html.duckduckgo.com https://en.wikipedia.org https://news.google.com https://nominatim.openstreetmap.org https://vid.puffyan.us https://inv.nadeko.net https://www.youtube.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://li.quest",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

function setHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Robots-Tag", "index, follow");
}

function buildCSP(isDev: boolean) {
  if (isDev) {
    return [...STATIC_CSP, "script-src 'self' 'unsafe-inline' 'unsafe-eval'"].join("; ");
  }
  const nonce = crypto.randomUUID().replace(/-/g, "");
  return [...STATIC_CSP, `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`].join("; ");
}

const API_CACHE: { prefix: string; value: string }[] = [
  { prefix: "/api/market-news", value: "s-maxage=60, stale-while-revalidate=120" },
  { prefix: "/api/market", value: "s-maxage=5, stale-while-revalidate=10" },
  { prefix: "/api/onchain", value: "s-maxage=15, stale-while-revalidate=30" },
  { prefix: "/api/twitter", value: "s-maxage=300, stale-while-revalidate=600" },
  { prefix: "/api/ecosystem", value: "s-maxage=3600, stale-while-revalidate=7200" },
  { prefix: "/api/stock-tokens", value: "s-maxage=60, stale-while-revalidate=120" },
  { prefix: "/api/live-activity", value: "s-maxage=10, stale-while-revalidate=30" },
  { prefix: "/api/global", value: "s-maxage=300, stale-while-revalidate=600" },
  { prefix: "/api/search", value: "s-maxage=60, stale-while-revalidate=300" },
];

function setApiCacheHeader(response: NextResponse, pathname: string) {
  if (!pathname.startsWith("/api/")) return;
  for (const rule of API_CACHE) {
    if (pathname.startsWith(rule.prefix)) {
      response.headers.set("Cache-Control", rule.value);
      return;
    }
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (ratelimit) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "127.0.0.1";

      const limiter = pathname.startsWith("/api/") && apiRatelimit ? apiRatelimit : ratelimit;
      const limit = await Promise.race([
        limiter.limit(ip),
        new Promise<{ success: true }>((resolve) => setTimeout(() => resolve({ success: true }), 2000)),
      ]);

      if (!limit.success) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429, headers: { "Retry-After": String((limit as { reset?: number }).reset ?? 60) } }
          );
        }
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": String((limit as { reset?: number }).reset ?? 60) },
        });
      }
    } catch {
      // rate limit unavailable — proceed without
    }
  }

  const response = NextResponse.next();
  setHeaders(response);
  setApiCacheHeader(response, pathname);
  const isDev = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  response.headers.set("Content-Security-Policy", buildCSP(isDev));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
