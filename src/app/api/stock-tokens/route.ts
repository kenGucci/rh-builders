import { NextRequest, NextResponse } from "next/server";
import { STOCK_TOKENS, liveStockLogoUrl } from "@/lib/stock-tokens";
import { getCompanyProfile } from "@/lib/company-profiles";
import { v2Fetch } from "@/lib/blockscout";

const CHAIN_INFO = {
  name: "Robinhood Chain",
  chainId: 4663,
  blockExplorer: "robinhoodchain.blockscout.com",
  nativeCurrency: "ETH",
};

interface LiveTokenData {
  tvl: number;
  logo: string;
  price: number;
  holders: number;
  totalSupply: string;
}

let liveCache: { tokens: Record<string, LiveTokenData>; ts: number } | null = null;
const LIVE_CACHE_TTL = 5 * 60_000;

async function loadLiveData(): Promise<Record<string, LiveTokenData>> {
  if (liveCache && Date.now() - liveCache.ts < LIVE_CACHE_TTL) {
    return liveCache.tokens;
  }
  const addresses = STOCK_TOKENS.map((t) => t.tokenAddress.toLowerCase());
  const results = await Promise.allSettled(
    addresses.map((addr) => v2Fetch(`/tokens/${addr}`, 120_000))
  );
  const map: Record<string, LiveTokenData> = {};
  results.forEach((res, i) => {
    const token = STOCK_TOKENS[i];
    if (res.status !== "fulfilled") return;
    const d = res.value as Record<string, unknown>;
    if (!d || !d.address_hash) return;
    const price = Number(d.exchange_rate || 0);
    const marketCap = Number(d.circulating_market_cap || 0);
    map[token.tokenAddress.toLowerCase()] = {
      tvl: Number.isFinite(marketCap) ? marketCap : 0,
      logo: typeof d.icon_url === "string" && d.icon_url ? d.icon_url : liveStockLogoUrl(token),
      price: Number.isFinite(price) ? price : 0,
      holders: Number(d.holders_count || 0),
      totalSupply: String(d.total_supply || ""),
    };
  });
  liveCache = { tokens: map, ts: Date.now() };
  return map;
}

function withProfile(token: (typeof STOCK_TOKENS)[number], live?: LiveTokenData) {
  const logo = live?.logo || liveStockLogoUrl(token);
  return {
    ...token,
    tvl: live?.tvl ?? 0,
    logo,
    livePrice: live?.price ?? 0,
    holdersCount: live?.holders ?? 0,
    totalSupply: live?.totalSupply ?? "",
    profile: getCompanyProfile(token.symbol),
  };
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "list";
  const sector = request.nextUrl.searchParams.get("sector");
  const symbol = request.nextUrl.searchParams.get("symbol");

  try {
    const live = await loadLiveData();

    if (action === "detail" && symbol) {
      const token = STOCK_TOKENS.find((t) => t.symbol === symbol.toUpperCase());
      if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });
      return NextResponse.json({ token: withProfile(token, live[token.tokenAddress.toLowerCase()]), chain: CHAIN_INFO }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
    }

    let tokens = [...STOCK_TOKENS];
    if (sector && sector !== "all") {
      tokens = tokens.filter((t) => t.sector.toLowerCase() === sector.toLowerCase());
    }

    const sectors = [...new Set(STOCK_TOKENS.map((t) => t.sector))];
    const totalTvl = tokens.reduce((sum, t) => sum + (live[t.tokenAddress.toLowerCase()]?.tvl ?? 0), 0);

    return NextResponse.json({
      tokens: tokens.map((t) => withProfile(t, live[t.tokenAddress.toLowerCase()])),
      sectors,
      chain: CHAIN_INFO,
      summary: {
        totalTokens: STOCK_TOKENS.length,
        totalTvl,
        sectors: sectors.length,
      },
    }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock tokens" }, { status: 500 });
  }
}
