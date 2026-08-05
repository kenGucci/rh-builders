import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ratelimit = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "60s"), analytics: true }) : null;

const STATIC_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://pbs.twimg.com https://abs.twimg.com https://robinhoodchain.blockscout.com https://en.wikipedia.org https://upload.wikimedia.org https://i.ytimg.com https://*.ytimg.com https://unavatar.io https://*.unavatar.io https://images.ctfassets.net https://www.google.com https://*.google.com https://s.yimg.com https://*.yimg.com https://cdn.robinhood.com https://*.robinhood.com https://assets.parqet.com https://financialmodelingprep.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://robinhoodchain.blockscout.com https://rpc.mainnet.chain.robinhood.com https://financialmodelingprep.com https://eth.blockscout.com https://polygon.blockscout.com https://arbitrum.blockscout.com https://optimism.blockscout.com https://base.blockscout.com https://bsc.blockscout.com https://publish.twitter.com https://api.twitter.com https://api.duckduckgo.com https://html.duckduckgo.com https://en.wikipedia.org https://news.google.com https://nominatim.openstreetmap.org https://vid.puffyan.us https://inv.nadeko.net https://www.youtube.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://li.quest https://relay.walletconnect.com wss://relay.walletconnect.com https://rpc.walletconnect.com https://explorer-api.walletconnect.com https://verify.walletconnect.com https://www.walletconnect.org wss://www.walletconnect.org https://api.coinbase.com https://wallet.coinbase.com wss://www.walletlink.org https://www.walletlink.org https://api.wallet.coinbase.com https://api.smartwallet.coinbase.com https://cdn.robinhood.com",
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
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(), payment=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Robots-Tag", "index, follow");
}

function buildCSP(isDev: boolean): { csp: string; nonce: string | null } {
  if (isDev) {
    return { csp: [...STATIC_CSP, "script-src 'self' 'unsafe-inline' 'unsafe-eval'"].join("; "), nonce: null };
  }
  const nonce = crypto.randomUUID().replace(/-/g, "");
  return { csp: [...STATIC_CSP, `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`].join("; "), nonce };
}

const API_CACHE: { prefix: string; value: string }[] = [
  { prefix: "/api/search", value: "s-maxage=60, stale-while-revalidate=120" },
  { prefix: "/api/market-news", value: "s-maxage=60, stale-while-revalidate=120" },
  { prefix: "/api/market", value: "s-maxage=5, stale-while-revalidate=10" },
  { prefix: "/api/onchain", value: "s-maxage=15, stale-while-revalidate=30" },
  { prefix: "/api/twitter", value: "s-maxage=300, stale-while-revalidate=600" },
  { prefix: "/api/ecosystem", value: "s-maxage=3600, stale-while-revalidate=7200" },
  { prefix: "/api/stock-tokens", value: "s-maxage=60, stale-while-revalidate=120" },
  { prefix: "/api/live-activity", value: "s-maxage=10, stale-while-revalidate=30" },
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

  const isApi = pathname.startsWith("/api/");
  if (ratelimit && isApi) {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "127.0.0.1";

      const limit = await ratelimit.limit(ip);

      if (!limit.success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.reset ?? 60) } }
        );
      }
    } catch {
      // rate limit unavailable — proceed without
    }
  }

  const isDev = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const { csp, nonce } = buildCSP(isDev);

  if (nonce) {
    // Propagate the nonce to the render request so Next.js injects it into the
    // generated <script> tags. Without this, strict-dynamic CSP blocks all scripts.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("content-security-policy", csp);
    return applyHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname,
      csp
    );
  }

  const response = NextResponse.next();
  setHeaders(response);
  setApiCacheHeader(response, pathname);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function applyHeaders(response: NextResponse, pathname: string, csp: string) {
  setHeaders(response);
  setApiCacheHeader(response, pathname);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
