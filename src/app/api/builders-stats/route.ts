import { NextResponse } from "next/server";
import builders from "@/lib/builders.json";

const V1 = "https://robinhoodchain.blockscout.com/api";
const V2 = "https://robinhoodchain.blockscout.com/api/v2";

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

async function fetchBuilderStats(address: string): Promise<BuilderStats | null> {
  try {
    const [addrRes, txRes, tokenRes] = await Promise.allSettled([
      fetch(`${V2}/addresses/${address.toLowerCase()}`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      fetch(`${V1}?module=account&action=txlist&address=${address}&page=1&offset=1000&sort=desc`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      fetch(`${V1}?module=account&action=tokentx&address=${address}&page=1&offset=1000&sort=desc`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
    ]);

    const addr = addrRes.status === "fulfilled" ? addrRes.value : {};
    const txData = txRes.status === "fulfilled" ? txRes.value : {};
    const tokenData = tokenRes.status === "fulfilled" ? tokenRes.value : {};

    const balWei = addr.coin_balance || "0";
    const balEth = Number(balWei) / 1e18;
    const rate = parseFloat(addr.exchange_rate || "0");
    const usd = balEth * rate;

    const txList = Array.isArray(txData.result) ? txData.result : [];
    const tokenList = Array.isArray(tokenData.result) ? tokenData.result : [];

    const lastTx = txList[0];
    const lastTxTs = lastTx?.timeStamp || null;

    return {
      address: address.toLowerCase(),
      balance: balWei,
      balanceFormatted: balEth < 0.001 && balEth > 0 ? balEth.toFixed(6) : balEth.toFixed(4),
      balanceUsd: usd > 0 ? `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0",
      txCount: txList.length,
      tokenCount: tokenList.length,
      isContract: addr.is_contract || false,
      lastTxTimestamp: lastTxTs,
      ethPrice: rate,
      name: addr.name || addr.token?.name || null,
      isVerified: addr.is_verified || false,
      tokenSymbol: addr.token?.symbol || null,
    };
  } catch (err) {
    console.error(`[builders-stats] Failed for ${address}:`, err);
    return null;
  }
}

export async function GET() {
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

  return NextResponse.json({ stats: statsMap });
}
