import { NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { fetchBuilderOnchainStats } from "@/lib/onchain-stats";

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

async function fetchBuilderStats(address: string): Promise<BuilderStats | null> {
  const stats = await fetchBuilderOnchainStats(address);
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

  const validBuilders = builders.builders.filter((b) => b.address && /^0x[a-fA-F0-9]{40}$/.test(b.address));
  const results = await Promise.allSettled(
    validBuilders.map((b) => fetchBuilderStats(b.address))
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
