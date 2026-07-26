import { NextResponse } from "next/server";

const DEXSCREENER_API = "https://api.dexscreener.com";
const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

interface DexToken {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string; label: string }>;
    socials?: Array<{ url: string; type: string }>;
  };
}

export async function GET() {
  try {
    // Fetch top tokens from Blockscout first (for addresses)
    const blockscoutRes = await fetch(
      `${BLOCKSCOUT_V2}/tokens?sort=holders_count&order=desc&limit=20`,
      { signal: AbortSignal.timeout(10000) }
    );

    let tokenAddresses: string[] = [];

    if (blockscoutRes.ok) {
      const blockscoutData = await blockscoutRes.json();
      const items = blockscoutData.items || [];
      tokenAddresses = items
        .filter((t: Record<string, unknown>) => t.address_hash)
        .map((t: Record<string, unknown>) => t.address_hash as string)
        .slice(0, 20);
    }

    // Also search DexScreener for Robinhood chain tokens
    const searchTerms = ["robinhood", "dih", "feather", "weth", "cate", "hood"];
    const searchResults = await Promise.allSettled(
      searchTerms.map(async (term) => {
        const res = await fetch(
          `${DEXSCREENER_API}/latest/dex/search?q=${term}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.pairs || []).filter(
          (p: DexToken) => p.chainId === "robinhood"
        );
      })
    );

    // Collect all unique token addresses from search results
    const searchPairs: DexToken[] = [];
    for (const result of searchResults) {
      if (result.status === "fulfilled") {
        for (const pair of result.value) {
          const addr = pair.baseToken?.address;
          if (addr && !tokenAddresses.includes(addr)) {
            tokenAddresses.push(addr);
          }
          searchPairs.push(pair);
        }
      }
    }

    // Fetch DexScreener data for all known addresses (batch in groups of 30)
    const allPairs: DexToken[] = [...searchPairs];
    const seenAddresses = new Set(searchPairs.map((p) => p.baseToken?.address));

    for (let i = 0; i < tokenAddresses.length; i += 30) {
      const batch = tokenAddresses.slice(i, i + 30).join(",");
      if (!batch) continue;
      try {
        const res = await fetch(
          `${DEXSCREENER_API}/latest/dex/tokens/${batch}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) continue;
        const data = await res.json();
        for (const pair of data.pairs || []) {
          if (pair.chainId === "robinhood" && !seenAddresses.has(pair.baseToken?.address)) {
            allPairs.push(pair);
            seenAddresses.add(pair.baseToken?.address);
          }
        }
      } catch {}
    }

    // Deduplicate: keep best pair per token (highest liquidity)
    const tokenMap = new Map<string, DexToken>();
    for (const pair of allPairs) {
      const addr = pair.baseToken?.address;
      if (!addr) continue;
      const existing = tokenMap.get(addr);
      if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
        tokenMap.set(addr, pair);
      }
    }

    // Sort by 24h volume (highest first)
    const tokens = Array.from(tokenMap.values())
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 20)
      .map((pair) => ({
        name: pair.baseToken?.name || "Unknown",
        symbol: pair.baseToken?.symbol || "???",
        address: pair.baseToken?.address || "",
        priceUsd: pair.priceUsd || "0",
        marketCap: pair.marketCap || pair.fdv || 0,
        fdv: pair.fdv || 0,
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        volume6h: pair.volume?.h6 || 0,
        volume1h: pair.volume?.h1 || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
        priceChange6h: pair.priceChange?.h6 || 0,
        buys24h: pair.txns?.h24?.buys || 0,
        sells24h: pair.txns?.h24?.sells || 0,
        buys1h: pair.txns?.h1?.buys || 0,
        sells1h: pair.txns?.h1?.sells || 0,
        dex: pair.dexId || "unknown",
        pairAddress: pair.pairAddress || "",
        url: pair.url || "",
        imageUrl: pair.info?.imageUrl || null,
        pairCreatedAt: pair.pairCreatedAt || 0,
        quoteSymbol: pair.quoteToken?.symbol || "WETH",
      }));

    return NextResponse.json({
      tokens,
      lastUpdated: new Date().toISOString(),
      chainId: "robinhood",
      source: "dexscreener",
    });
  } catch (err) {
    console.error("[dex-screener] Failed:", err);
    return NextResponse.json({ tokens: [], lastUpdated: new Date().toISOString() });
  }
}
