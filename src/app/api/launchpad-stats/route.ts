import { NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { getLaunchpadStats } from "@/lib/launchpad-stats";

let cache: { data: LaunchpadAggregatedStats; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

interface LaunchpadAggregatedStats {
  txCount: number;
  tokenTransfers: number;
  uniqueBuilders: number;
  builders: Array<{
    name: string;
    address: string;
    txCount: number;
    tokenTransfers: number;
    coinBalance: string;
    coinBalanceUsd: string;
    isContract: boolean;
  }>;
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const launchpadAddresses = builders.builders
    .filter((b) => b.category === "Launchpad" && /^0x[a-fA-F0-9]{40}$/.test(b.address))
    .map((b) => ({ name: b.name, address: b.address }));

  const results = await Promise.allSettled(
    launchpadAddresses.map((b) => getLaunchpadStats(b.address))
  );

  const builderStats: LaunchpadAggregatedStats["builders"] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) {
      const stats = r.value;
      builderStats.push({
        name: launchpadAddresses[i].name,
        address: launchpadAddresses[i].address,
        txCount: stats.txCount,
        tokenTransfers: stats.tokenTransfers,
        coinBalance: stats.coinBalance,
        coinBalanceUsd: stats.coinBalanceUsd,
        isContract: stats.isContract,
      });
    }
  }

  const data: LaunchpadAggregatedStats = {
    txCount: builderStats.reduce((s, b) => s + b.txCount, 0),
    tokenTransfers: builderStats.reduce((s, b) => s + b.tokenTransfers, 0),
    uniqueBuilders: builderStats.filter((b) => b.txCount > 0).length,
    builders: builderStats.sort((a, b) => b.txCount - a.txCount),
  };

  cache = { data, timestamp: Date.now() };

  return NextResponse.json(data);
}
