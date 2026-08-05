import { v2Fetch } from "@/lib/blockscout";

export interface BuilderOnchainStats {
  balanceWei: string;
  balanceEth: string;
  balanceUsd: string;
  txCount: number;
  tokenTransfers: number;
  isContract: boolean;
  isVerified: boolean;
  name: string | null;
  tokenSymbol: string | null;
  ethPrice: number;
  lastTxTimestamp: string | null;
}

export async function fetchBuilderOnchainStats(address: string): Promise<BuilderOnchainStats | null> {
  const addr = address.toLowerCase();
  const [addrRes, countersRes, txsRes] = await Promise.allSettled([
    v2Fetch(`/addresses/${addr}`),
    v2Fetch(`/addresses/${addr}/counters`),
    v2Fetch(`/addresses/${addr}/transactions?items_count=1`),
  ]);

  const data = addrRes.status === "fulfilled" ? (addrRes.value as Record<string, unknown>) : null;
  const counters = countersRes.status === "fulfilled" ? (countersRes.value as Record<string, unknown>) : null;
  const txs = txsRes.status === "fulfilled" ? (txsRes.value as { items?: Record<string, unknown>[] }) : null;

  const balWei = String(data?.coin_balance || "0");
  const balEth = Number(balWei) / 1e18;
  const ethPrice = Number(data?.exchange_rate || 0);
  const usd = balEth * ethPrice;

  const txItems = txs?.items || [];
  const lastTxTimestamp = (txItems[0]?.timestamp as string) || null;

  const tokenObj = data?.token as Record<string, unknown> | undefined;

  return {
    balanceWei: balWei,
    balanceEth: balEth < 0.001 && balEth > 0 ? balEth.toFixed(6) : balEth.toFixed(4),
    balanceUsd: usd > 0 ? `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0",
    txCount: Number(counters?.transactions_count || 0),
    tokenTransfers: Number(counters?.token_transfers_count || 0),
    isContract: Boolean(data?.is_contract),
    isVerified: Boolean(data?.is_verified),
    name: (data?.name as string) || (tokenObj?.name as string) || null,
    tokenSymbol: (tokenObj?.symbol as string) || null,
    ethPrice,
    lastTxTimestamp,
  };
}
