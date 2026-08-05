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
    return NextResponse.json(
      { error: "Live chain stats temporarily unavailable. Retrying..." },
      { status: 503 }
    );
  }
}
