import { NextRequest, NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { v2Fetch } from "@/lib/blockscout";

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
  tokenCount: number;
  avatar: string | null;
  isContract: boolean;
  lastTxTimestamp: string | null;
}

const statsCache = new Map<string, { data: BuilderLight[]; ts: number }>();
const CACHE_TTL = 60_000;

async function fetchBuilderStats(address: string): Promise<Partial<BuilderLight>> {
  try {
    const data = await v2Fetch(`/addresses/${address}`) as Record<string, unknown>;

    const rawBalance = String(data.coin_balance || "0");
    const balanceEth = (Number(rawBalance) / 1e18).toFixed(4);
    const coinPrice = Number(data.coin_price || 0);
    const balanceUsd = (Number(balanceEth) * coinPrice).toFixed(2);

    return {
      balanceEth,
      balanceUsd,
      txCount: Number(data.transaction_count || 0),
      tokenCount: Number(data.token_balances_count || data.tokens_count || 0),
      isContract: Boolean(data.is_contract),
      lastTxTimestamp: (data.last_tx_at as string) || null,
      avatar: null,
    };
  } catch (err) {
    console.error("[top-builders] Stats fetch failed:", address, err);
    return {};
  }
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
      const stats = await fetchBuilderStats(b.address);
      return {
        address: b.address,
        name: b.name,
        handle: b.twitter || null,
        description: b.description || "",
        tags: b.tags || [],
        category: b.category || "",
        website: b.website || "",
        balanceEth: stats.balanceEth || "0",
        balanceUsd: stats.balanceUsd || "0",
        txCount: stats.txCount || 0,
        tokenCount: stats.tokenCount || 0,
        avatar: stats.avatar || null,
        isContract: stats.isContract || false,
        lastTxTimestamp: stats.lastTxTimestamp || null,
      } satisfies BuilderLight;
    })
  );

  const builderResults = results
    .filter((r): r is PromiseFulfilledResult<BuilderLight> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => b.txCount - a.txCount);

  statsCache.set(cacheKey, { data: builderResults, ts: Date.now() });

  return NextResponse.json({
    builders: builderResults,
    total: onChainBuilders.length,
    cached: false,
  });
}
