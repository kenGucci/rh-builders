import { NextRequest, NextResponse } from "next/server";
import { findStockToken, liveStockLogoUrl } from "@/lib/stock-tokens";
import { getRhjQuotes } from "@/lib/rhj";

const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface TokenProfile {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
  websites: Array<{ url: string; label: string }>;
  socials: Array<{ url: string; type: string }>;
  description: string | null;
  pairs: Array<{
    dex: string;
    pairAddress: string;
    quoteSymbol: string;
    priceUsd: string;
    priceNative: string;
    marketCap: number;
    fdv: number;
    liquidityUsd: number;
    volume24h: number;
    volume6h: number;
    volume1h: number;
    priceChange24h: number;
    priceChange1h: number;
    priceChange6h: number;
    buys24h: number;
    sells24h: number;
    buys1h: number;
    sells1h: number;
    url: string;
    pairCreatedAt: number;
  }>;
  onChain: {
    totalSupply: string | null;
    holders: number | null;
    decimals: number | null;
    tokenType: string | null;
  };
}

const cache = new Map<string, { data: TokenProfile; ts: number }>();
const CACHE_TTL = 30_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const addr = address?.toLowerCase();

  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const cached = cache.get(addr);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const [bsData, countersData] = await Promise.allSettled([
      fetch(`${BLOCKSCOUT_V2}/tokens/${addr}`, {
        signal: AbortSignal.timeout(8000),
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${BLOCKSCOUT_V2}/tokens/${addr}/counters`, {
        signal: AbortSignal.timeout(8000),
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const bsResult = bsData.status === "fulfilled" ? bsData.value : null;
    const counters = countersData.status === "fulfilled" ? countersData.value : null;

    const stockToken = findStockToken(addr);
    const stockImage = stockToken ? liveStockLogoUrl(stockToken) : null;
    const stockQuote = stockToken
      ? (await getRhjQuotes([stockToken.symbol]))[stockToken.symbol]
      : null;

    const priceUsd =
      stockQuote?.bid || bsResult?.exchange_rate || "0";
    const marketCap = bsResult?.circulating_market_cap
      ? Number(bsResult.circulating_market_cap)
      : 0;
    const volume24h = bsResult?.volume_24h
      ? Number(bsResult.volume_24h)
      : 0;

    const profile: TokenProfile = {
      name: bsResult?.name || stockToken?.name || "Unknown",
      symbol: bsResult?.symbol || stockToken?.symbol || "???",
      address: addr,
      imageUrl: stockImage || bsResult?.icon_url || null,
      websites: [],
      socials: [],
      description: bsResult?.description || null,
      pairs: [
        {
          dex: "robinhood",
          pairAddress: "",
          quoteSymbol: "USD",
          priceUsd,
          priceNative: "0",
          marketCap,
          fdv: marketCap,
          liquidityUsd: 0,
          volume24h,
          volume6h: 0,
          volume1h: 0,
          priceChange24h: 0,
          priceChange1h: 0,
          priceChange6h: 0,
          buys24h: 0,
          sells24h: 0,
          buys1h: 0,
          sells1h: 0,
          url: stockToken
            ? `https://robinhoodchain.blockscout.com/token/${addr}`
            : `https://robinhoodchain.blockscout.com/token/${addr}`,
          pairCreatedAt: 0,
        },
      ],
      onChain: {
        totalSupply: bsResult?.total_supply || null,
        holders: counters?.token_holders_count
          ? parseInt(counters.token_holders_count, 10)
          : bsResult?.holders || null,
        decimals: bsResult?.decimals ? parseInt(bsResult.decimals) : null,
        tokenType: bsResult?.token_type || null,
      },
    };

    cache.set(addr, { data: profile, ts: Date.now() });
    return NextResponse.json(profile);
  } catch (err) {
    console.error("[token-profile] Failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch token profile" },
      { status: 500 }
    );
  }
}
