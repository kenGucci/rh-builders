import { NextResponse } from "next/server";
import { fetchChainStats, fetchRecentTransactions, fetchTopTokens } from "@/lib/kol-service";

export async function GET() {
  try {
    const [stats, recentTxs, topTokens] = await Promise.all([
      fetchChainStats(),
      fetchRecentTransactions(),
      fetchTopTokens(),
    ]);

    return NextResponse.json({
      ...stats,
      recentTransactions: recentTxs.slice(0, 10),
      topTokens: topTokens.slice(0, 10),
    });
  } catch (err) {
    console.error("[chain-stats]", err);
    return NextResponse.json({
      totalAddresses: 0,
      totalTransactions: 0,
      totalBlocks: 0,
      txsToday: 0,
      coinPrice: "0",
      marketCap: "0",
      avgBlockTime: 0,
      gasPrices: { slow: 0, average: 0, fast: 0 },
      recentTransactions: [],
      topTokens: [],
    }, { status: 200 });
  }
}
