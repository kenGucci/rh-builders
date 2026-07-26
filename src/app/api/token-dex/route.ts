import { NextRequest, NextResponse } from "next/server";

const DEXSCREENER_API = "https://api.dexscreener.com";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${DEXSCREENER_API}/latest/dex/tokens/${address.toLowerCase()}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      return NextResponse.json({ pairs: [] });
    }

    const data = await res.json();
    const pairs = (data.pairs || [])
      .filter((p: Record<string, unknown>) => p.chainId === "robinhood")
      .map((pair: Record<string, unknown>) => ({
        name: (pair.baseToken as Record<string, unknown>)?.name || "Unknown",
        symbol: (pair.baseToken as Record<string, unknown>)?.symbol || "???",
        address: (pair.baseToken as Record<string, unknown>)?.address || "",
        priceUsd: pair.priceUsd || "0",
        priceNative: pair.priceNative || "0",
        marketCap: pair.marketCap || pair.fdv || 0,
        fdv: pair.fdv || 0,
        liquidityUsd: (pair.liquidity as Record<string, unknown>)?.usd || 0,
        volume24h: (pair.volume as Record<string, unknown>)?.h24 || 0,
        volume6h: (pair.volume as Record<string, unknown>)?.h6 || 0,
        volume1h: (pair.volume as Record<string, unknown>)?.h1 || 0,
        priceChange24h: (pair.priceChange as Record<string, unknown>)?.h24 || 0,
        priceChange1h: (pair.priceChange as Record<string, unknown>)?.h1 || 0,
        buys24h: ((pair.txns as Record<string, unknown>)?.h24 as Record<string, unknown>)?.buys || 0,
        sells24h: ((pair.txns as Record<string, unknown>)?.h24 as Record<string, unknown>)?.sells || 0,
        dex: pair.dexId || "unknown",
        pairAddress: pair.pairAddress || "",
        url: pair.url || "",
        pairCreatedAt: pair.pairCreatedAt || 0,
        quoteSymbol: (pair.quoteToken as Record<string, unknown>)?.symbol || "WETH",
      }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(b.liquidityUsd) || 0) - (Number(a.liquidityUsd) || 0));

    return NextResponse.json({
      address: address.toLowerCase(),
      pairs,
      bestPair: pairs[0] || null,
    });
  } catch {
    return NextResponse.json({ address: address.toLowerCase(), pairs: [], bestPair: null });
  }
}
