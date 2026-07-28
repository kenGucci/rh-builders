import { NextResponse } from "next/server";
import builders from "@/lib/builders.json";
import { v2Fetch } from "@/lib/blockscout";

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
const CACHE_TTL = 30000;

async function fetchBuilderStats(address: string): Promise<BuilderStats | null> {
  try {
    const data = await v2Fetch(`/addresses/${address.toLowerCase()}`) as Record<string, unknown>;

    const balWei = String(data.coin_balance || "0");
    const balEth = Number(balWei) / 1e18;
    const rate = Number(data.coin_price || "0");
    const usd = balEth * rate;

    const tokenObj = data.token as Record<string, unknown> | undefined;

    return {
      address: address.toLowerCase(),
      balance: balWei,
      balanceFormatted: balEth < 0.001 && balEth > 0 ? balEth.toFixed(6) : balEth.toFixed(4),
      balanceUsd: usd > 0 ? `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0",
      txCount: Number(data.transaction_count || 0),
      tokenCount: Number(data.token_balances_count || data.tokens_count || 0),
      isContract: Boolean(data.is_contract),
      lastTxTimestamp: (data.last_tx_at as string) || null,
      ethPrice: rate,
      name: (data.name as string) || (tokenObj?.name as string) || null,
      isVerified: Boolean(data.is_verified),
      tokenSymbol: (tokenObj?.symbol as string) || null,
    };
  } catch (err) {
    console.error("[builders-stats] Failed for address:", address, err);
    return null;
  }
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
