import { NextRequest, NextResponse } from "next/server";
import { STOCK_TOKENS } from "@/lib/stock-tokens";

const CHAIN_INFO = {
  name: "Robinhood Chain",
  chainId: 4663,
  blockExplorer: "robinhoodchain.blockscout.com",
  nativeCurrency: "ETH",
};

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "list";
  const sector = request.nextUrl.searchParams.get("sector");
  const symbol = request.nextUrl.searchParams.get("symbol");

  try {
    if (action === "detail" && symbol) {
      const token = STOCK_TOKENS.find((t) => t.symbol === symbol.toUpperCase());
      if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });
      return NextResponse.json({ token, chain: CHAIN_INFO }, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
    }

    let tokens = [...STOCK_TOKENS];
    if (sector && sector !== "all") {
      tokens = tokens.filter((t) => t.sector.toLowerCase() === sector.toLowerCase());
    }

    const sectors = [...new Set(STOCK_TOKENS.map((t) => t.sector))];
    const totalTvl = STOCK_TOKENS.reduce((sum, t) => sum + t.tvl, 0);

    return NextResponse.json({
      tokens,
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
