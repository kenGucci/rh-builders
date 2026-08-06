import { NextResponse } from "next/server";
import { discoverAllBuilders } from "@/lib/discover-builders";
import { fetchBuilderOnchainStats, type BuilderOnchainStats } from "@/lib/onchain-stats";

export const maxDuration = 60;

interface BuilderStats {
  address: string;
  balance: string;
  balanceFormatted: string;
  balanceUsd: string;
  txCount: number;
  tokenCount: number;
  isContract: boolean;
  lastTxTimestamp: string | null;
  ethPrice: number;
  name: string | null;
  isVerified: boolean;
  tokenSymbol: string | null;
}

let cache: { data: Record<string, BuilderStats>; timestamp: number } | null = null;
const CACHE_TTL = 60000;

async function fetchBuilderStats(
  address: string,
  existing?: BuilderOnchainStats | null
): Promise<BuilderStats | null> {
  const stats = existing ?? (await fetchBuilderOnchainStats(address));
  if (!stats) return null;

  return {
    address: address.toLowerCase(),
    balance: stats.balanceWei,
    balanceFormatted: stats.balanceEth,
    balanceUsd: stats.balanceUsd,
    txCount: stats.txCount,
    tokenCount: stats.tokenTransfers,
    isContract: stats.isContract,
    lastTxTimestamp: stats.lastTxTimestamp,
    ethPrice: stats.ethPrice,
    name: stats.name,
    isVerified: stats.isVerified,
    tokenSymbol: stats.tokenSymbol,
  };
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ stats: cache.data });
  }

  const builders = await discoverAllBuilders({ limit: 100 });

  const results = await Promise.allSettled(
    builders.map((b) => fetchBuilderStats(b.address, b.stat))
  );

  const statsMap: Record<string, BuilderStats> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      statsMap[r.value.address] = r.value;
    }
  }

  cache = { data: statsMap, timestamp: Date.now() };

  return NextResponse.json({ stats: statsMap, count: Object.keys(statsMap).length });
}
