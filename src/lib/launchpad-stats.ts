const BLOCKSCOUT = "https://robinhoodchain.blockscout.com/api/v2";

export interface LaunchpadStats {
  address: string;
  txCount: number;
  tokenTransfers: number;
  coinBalance: string;
  coinBalanceUsd: string;
  isContract: boolean;
  lastUpdated: number;
}

const cache = new Map<string, LaunchpadStats>();
const CACHE_TTL = 60_000;

async function apiFetch(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getLaunchpadStats(address: string): Promise<LaunchpadStats> {
  const lower = address.toLowerCase();
  const cached = cache.get(lower);
  if (cached && Date.now() - cached.lastUpdated < CACHE_TTL) return cached;

  const data = await apiFetch(`${BLOCKSCOUT}/addresses/${lower}`) as Record<string, unknown> | null;

  const stats: LaunchpadStats = {
    address: lower,
    txCount: data ? Number(data.transactions_count || 0) : 0,
    tokenTransfers: data ? Number(data.token_transfers_count || 0) : 0,
    coinBalance: String(data?.coin_balance || "0"),
    coinBalanceUsd: String(data?.coin_balance_usd || "0"),
    isContract: Boolean(data?.is_contract),
    lastUpdated: Date.now(),
  };

  cache.set(lower, stats);
  return stats;
}

export async function getLaunchpadDeployedCount(launchpadAddr: string): Promise<number> {
  const data = await apiFetch(
    `${BLOCKSCOUT}/addresses/${launchpadAddr}/internal-transactions?type=token_transfer`
  ) as { items_count?: number } | null;
  return data?.items_count || 0;
}

export async function getChainTotalTokens(): Promise<number> {
  const data = await apiFetch(`${BLOCKSCOUT}/tokens?type=ERC-20&limit=1`) as { items_count?: number } | null;
  return data?.items_count || 0;
}

export async function getChainTotalAddresses(): Promise<number> {
  const data = await apiFetch(`${BLOCKSCOUT}/stats`) as { total_addresses?: number } | null;
  return data?.total_addresses || 0;
}

export async function getChainTotalTransactions(): Promise<number> {
  const data = await apiFetch(`${BLOCKSCOUT}/stats`) as { total_transactions?: number } | null;
  return data?.total_transactions || 0;
}

export async function getChainStats(): Promise<{
  totalAddresses: number;
  totalTransactions: number;
  totalTokens: number;
  blocksToday: number;
  txsToday: number;
}> {
  const [statsData, tokensData] = await Promise.all([
    apiFetch(`${BLOCKSCOUT}/stats`),
    apiFetch(`${BLOCKSCOUT}/tokens?type=ERC-20&limit=1`),
  ]);

  const s = statsData as Record<string, unknown> | null;
  const t = tokensData as Record<string, unknown> | null;

  return {
    totalAddresses: Number(s?.total_addresses || 0),
    totalTransactions: Number(s?.total_transactions || 0),
    totalTokens: Number(t?.items_count || 0),
    blocksToday: Number(s?.total_blocks || 0),
    txsToday: Number(s?.transactions_today || 0),
  };
}
