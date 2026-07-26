export interface DetectedToken {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  creator: string | null;
  createdAt: string;
  blockNumber: number;
  txHash: string;
  holders: number;
  explorerUrl: string;
  iconUrl: string | null;
  volume24h: string | null;
  exchangeRate: string | null;
  priceUsd: string | null;
  marketCap: string | null;
  ethPriceUsd: number | null;
  transferCount: number;
  holderHistory: number[];
  transferHistory: number[];
  lastUpdated: number;
}

const store = new Map<string, DetectedToken>();
const MAX_TOKENS = 200;
const MAX_HISTORY = 24;

export function addToken(token: DetectedToken): void {
  if (store.size >= MAX_TOKENS) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(token.address.toLowerCase(), token);
}

export function getToken(address: string): DetectedToken | undefined {
  return store.get(address.toLowerCase());
}

export function getAllTokens(): DetectedToken[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateTokenMetrics(
  address: string,
  metrics: Partial<Pick<DetectedToken, "holders" | "transferCount" | "priceUsd" | "marketCap" | "ethPriceUsd" | "volume24h" | "exchangeRate">>
): void {
  const token = store.get(address.toLowerCase());
  if (!token) return;
  Object.assign(token, metrics, { lastUpdated: Date.now() });
}

export function pushHolderHistory(address: string, count: number): void {
  const token = store.get(address.toLowerCase());
  if (!token) return;
  token.holderHistory.push(count);
  if (token.holderHistory.length > MAX_HISTORY) token.holderHistory.shift();
}

export function pushTransferHistory(address: string, count: number): void {
  const token = store.get(address.toLowerCase());
  if (!token) return;
  token.transferHistory.push(count);
  if (token.transferHistory.length > MAX_HISTORY) token.transferHistory.shift();
}

export { MAX_HISTORY };
