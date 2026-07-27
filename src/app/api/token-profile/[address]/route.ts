import { NextRequest, NextResponse } from "next/server";

const DEXSCREENER_API = "https://api.dexscreener.com";
const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: { h24: number; h6: number; h1: number; m5: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string; label: string }>;
    socials?: Array<{ url: string; type: string }>;
  };
}

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
    const [dexData, bsData] = await Promise.allSettled([
      fetch(`${DEXSCREENER_API}/latest/dex/tokens/${addr}`, {
        signal: AbortSignal.timeout(8000),
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${BLOCKSCOUT_V2}/tokens/${addr}`, {
        signal: AbortSignal.timeout(8000),
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const dexResult = dexData.status === "fulfilled" ? dexData.value : null;
    const bsResult = bsData.status === "fulfilled" ? bsData.value : null;

    const robinhoodPairs = (dexResult?.pairs || []).filter(
      (p: DexPair) => p.chainId === "robinhood"
    );

    // Get profile info from first pair
    const firstPair = robinhoodPairs[0];

    const profile: TokenProfile = {
      name: firstPair?.baseToken?.name || bsResult?.name || "Unknown",
      symbol: firstPair?.baseToken?.symbol || bsResult?.symbol || "???",
      address: addr,
      imageUrl: firstPair?.info?.imageUrl || bsResult?.icon_url || null,
      websites: firstPair?.info?.websites || [],
      socials: firstPair?.info?.socials || [],
      description: bsResult?.description || null,
      pairs: robinhoodPairs
        .sort(
          (a: DexPair, b: DexPair) =>
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )
        .map((p: DexPair) => ({
          dex: p.dexId || "unknown",
          pairAddress: p.pairAddress || "",
          quoteSymbol: p.quoteToken?.symbol || "WETH",
          priceUsd: p.priceUsd || "0",
          priceNative: p.priceNative || "0",
          marketCap: p.marketCap || p.fdv || 0,
          fdv: p.fdv || 0,
          liquidityUsd: p.liquidity?.usd || 0,
          volume24h: p.volume?.h24 || 0,
          volume6h: p.volume?.h6 || 0,
          volume1h: p.volume?.h1 || 0,
          priceChange24h: p.priceChange?.h24 || 0,
          priceChange1h: p.priceChange?.h1 || 0,
          priceChange6h: p.priceChange?.h6 || 0,
          buys24h: p.txns?.h24?.buys || 0,
          sells24h: p.txns?.h24?.sells || 0,
          buys1h: p.txns?.h1?.buys || 0,
          sells1h: p.txns?.h1?.sells || 0,
          url: p.url || "",
          pairCreatedAt: p.pairCreatedAt || 0,
        })),
      onChain: {
        totalSupply: bsResult?.total_supply || null,
        holders: bsResult?.holders || null,
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
