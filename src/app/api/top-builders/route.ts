import { NextRequest, NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { fetchBuilderOnchainStats } from "@/lib/onchain-stats";

interface BuilderLight {
  address: string;
  name: string;
  handle: string | null;
  description: string;
  tags: string[];
  category: string;
  website: string;
  balanceEth: string;
  balanceUsd: string;
  txCount: number;
  tokenTransfers: number;
  isContract: boolean;
  lastTxTimestamp: string | null;
  isActive: boolean;
  activeMinsAgo: number | null;
}

const statsCache = new Map<string, { data: BuilderLight[]; ts: number }>();
const CACHE_TTL = 60_000;

function activeMinsAgo(lastTxTimestamp: string | null): number | null {
  if (!lastTxTimestamp) return null;
  const t = new Date(lastTxTimestamp).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 60_000));
}

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

  const cacheKey = `builders-${limit}-${offset}`;
  const cached = statsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ builders: cached.data, cached: true });
  }

  const onChainBuilders = builders.builders.filter(
    (b) => b.address && b.address.trim() !== "" && b.address.startsWith("0x")
  );

  const batch = onChainBuilders.slice(offset, offset + limit);

  const results = await Promise.allSettled(
    batch.map(async (b) => {
      const stats = await fetchBuilderOnchainStats(b.address);
      const mins = stats ? activeMinsAgo(stats.lastTxTimestamp) : null;
      return {
        address: b.address,
        name: b.name,
        handle: b.twitter || null,
        description: b.description || "",
        tags: b.tags || [],
        category: b.category || "",
        website: b.website || "",
        balanceEth: stats?.balanceEth || "0",
        balanceUsd: stats?.balanceUsd || "$0",
        txCount: stats?.txCount || 0,
        tokenTransfers: stats?.tokenTransfers || 0,
        isContract: stats?.isContract || false,
        lastTxTimestamp: stats?.lastTxTimestamp || null,
        isActive: mins !== null && mins < 24 * 60,
        activeMinsAgo: mins,
      } satisfies BuilderLight;
    })
  );

  const builderResults = results
    .filter((r): r is PromiseFulfilledResult<BuilderLight> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => {
      const aTs = a.lastTxTimestamp ? new Date(a.lastTxTimestamp).getTime() : 0;
      const bTs = b.lastTxTimestamp ? new Date(b.lastTxTimestamp).getTime() : 0;
      if (bTs !== aTs) return bTs - aTs;
      return b.txCount - a.txCount;
    });

  statsCache.set(cacheKey, { data: builderResults, ts: Date.now() });

  return NextResponse.json({
    builders: builderResults,
    total: onChainBuilders.length,
    cached: false,
  });
}
