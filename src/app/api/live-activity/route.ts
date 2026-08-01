import { NextResponse } from "next/server";
import { getRobinhoodTokens, getLatestBlock, mapPair } from "@/lib/token-discovery";

export const revalidate = 0;

export async function GET() {
  try {
    const [tokenData, blockNumber] = await Promise.all([
      getRobinhoodTokens(),
      getLatestBlock(),
    ]);

    const pairs = Array.from(tokenData.bestPerToken.values());
    const now = Date.now();
    const oneDayAgo = now - 86400 * 1000;

    const newTokens = pairs
      .filter((p) => p.pairCreatedAt && p.pairCreatedAt > oneDayAgo)
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));

    const trending = pairs
      .filter((p) => (p.volume?.h24 || 0) > 0)
      .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

    const recentActivity = pairs
      .filter((p) => (p.txns?.h1?.buys || 0) + (p.txns?.h1?.sells || 0) > 0)
      .sort((a, b) => {
        const aTxns = (a.txns?.h1?.buys || 0) + (a.txns?.h1?.sells || 0);
        const bTxns = (b.txns?.h1?.buys || 0) + (b.txns?.h1?.sells || 0);
        return bTxns - aTxns;
      });

    const hot = pairs
      .filter((p) => (p.txns?.h1?.buys || 0) + (p.txns?.h1?.sells || 0) > 5)
      .sort((a, b) => {
        const aRatio = (a.txns?.h1?.buys || 0) / ((a.txns?.h1?.buys || 0) + (a.txns?.h1?.sells || 0));
        const bRatio = (b.txns?.h1?.buys || 0) / ((b.txns?.h1?.buys || 0) + (b.txns?.h1?.sells || 0));
        return bRatio - aRatio;
      });

    return NextResponse.json({
      newTokens: newTokens.slice(0, 15).map(mapPair),
      trending: trending.slice(0, 20).map(mapPair),
      recentActivity: recentActivity.slice(0, 20).map(mapPair),
      hot: hot.slice(0, 10).map(mapPair),
      block_number: blockNumber,
      totalTokens: tokenData.bestPerToken.size,
      lastUpdated: new Date().toISOString(),
    }, { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" } });
  } catch (err) {
    console.error("[live-activity] Failed:", err);
    return NextResponse.json({
      newTokens: [],
      trending: [],
      recentActivity: [],
      hot: [],
      block_number: 0,
      totalTokens: 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}
