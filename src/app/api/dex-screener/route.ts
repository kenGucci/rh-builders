import { NextRequest, NextResponse } from "next/server";
import { getRobinhoodTokens, mapPair } from "@/lib/token-discovery";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const sortBy = request.nextUrl.searchParams.get("sort") || "volume";
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);

  try {
    const { bestPerToken } = await getRobinhoodTokens();

    let tokens = Array.from(bestPerToken.values()).map(mapPair);

    if (sortBy === "volume") {
      tokens.sort((a, b) => b.volume24h - a.volume24h);
    } else if (sortBy === "price") {
      tokens.sort((a, b) => Number(b.priceUsd) - Number(a.priceUsd));
    } else if (sortBy === "liquidity") {
      tokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);
    } else if (sortBy === "change") {
      tokens.sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));
    } else if (sortBy === "newest") {
      tokens.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
    }

    tokens = tokens.slice(0, limit);

    return NextResponse.json({
      tokens,
      lastUpdated: new Date().toISOString(),
      chainId: "robinhood",
      source: "dexscreener+blockscout",
      totalTokens: bestPerToken.size,
    });
  } catch (err) {
    console.error("[dex-screener] Failed:", err);
    return NextResponse.json({ tokens: [], lastUpdated: new Date().toISOString(), totalTokens: 0 });
  }
}
