const BLOCKSCOUT_V2 = "https://robinhoodchain.blockscout.com/api/v2";

export interface DexPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: { h24: number; h6: number; h1: number; m5: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string; label: string }>;
    socials?: Array<{ url: string; type: string }>;
  };
}

export interface MappedToken {
  name: string;
  symbol: string;
  address: string;
  priceUsd: string;
  priceNative: string;
  marketCap: number;
  fdv: number;
  liquidityUsd: number;
  volume24h: number;
  volume6h: number;
  volume1h: number;
  volumeM5: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChangeM5: number;
  buys24h: number;
  sells24h: number;
  buys1h: number;
  sells1h: number;
  buysM5: number;
  sellsM5: number;
  dex: string;
  pairAddress: string;
  url: string;
  imageUrl: string | null;
    pairCreatedAt: number;
    quoteSymbol: string;
    websites?: Array<{ url: string; label: string }>;
    socials?: Array<{ url: string; type: string }>;
}

interface BlockscoutToken {
  address_hash: string;
  name: string;
  symbol: string;
  exchange_rate: string;
  circulating_market_cap: string;
  holders_count: string;
  icon_url: string | null;
  volume_24h: string;
  decimals: string;
  total_supply: string;
}

function blockscoutTokenToPair(t: BlockscoutToken): DexPair {
  const addr = t.address_hash || "";
  return {
    chainId: "robinhood",
    dexId: "blockscout",
    pairAddress: "",
    url: `https://robinhoodchain.blockscout.com/token/${addr}`,
    baseToken: { address: addr, name: t.name || "Unknown", symbol: t.symbol || "???" },
    quoteToken: { address: "", name: "USD", symbol: "USD" },
    priceNative: "0",
    priceUsd: t.exchange_rate || "0",
    txns: { m5: { buys: 0, sells: 0 }, h1: { buys: 0, sells: 0 }, h6: { buys: 0, sells: 0 }, h24: { buys: 0, sells: 0 } },
    volume: { h24: Number(t.volume_24h) || 0, h6: 0, h1: 0, m5: 0 },
    priceChange: { m5: 0, h1: 0, h6: 0, h24: 0 },
    liquidity: { usd: 0, base: 0, quote: 0 },
    fdv: Number(t.circulating_market_cap) || 0,
    marketCap: Number(t.circulating_market_cap) || 0,
    pairCreatedAt: 0,
    info: { imageUrl: t.icon_url || undefined, websites: [], socials: [] },
  };
}

export function mapPair(pair: DexPair): MappedToken {
  return {
    name: pair.baseToken?.name || "Unknown",
    symbol: pair.baseToken?.symbol || "???",
    address: pair.baseToken?.address || "",
    priceUsd: pair.priceUsd || "0",
    priceNative: pair.priceNative || "0",
    marketCap: pair.marketCap || pair.fdv || 0,
    fdv: pair.fdv || 0,
    liquidityUsd: pair.liquidity?.usd || 0,
    volume24h: pair.volume?.h24 || 0,
    volume6h: pair.volume?.h6 || 0,
    volume1h: pair.volume?.h1 || 0,
    volumeM5: pair.volume?.m5 || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    priceChange1h: pair.priceChange?.h1 || 0,
    priceChange6h: pair.priceChange?.h6 || 0,
    priceChangeM5: pair.priceChange?.m5 || 0,
    buys24h: pair.txns?.h24?.buys || 0,
    sells24h: pair.txns?.h24?.sells || 0,
    buys1h: pair.txns?.h1?.buys || 0,
    sells1h: pair.txns?.h1?.sells || 0,
    buysM5: pair.txns?.m5?.buys || 0,
    sellsM5: pair.txns?.m5?.sells || 0,
    dex: pair.dexId || "unknown",
    pairAddress: pair.pairAddress || "",
    url: pair.url || "",
    imageUrl: pair.info?.imageUrl || null,
    pairCreatedAt: pair.pairCreatedAt || 0,
    quoteSymbol: pair.quoteToken?.symbol || "WETH",
    websites: pair.info?.websites || [],
    socials: pair.info?.socials || [],
  };
}

interface CacheEntry {
  pairs: DexPair[];
  bestPerToken: Map<string, DexPair>;
  ts: number;
}

let cachePromise: Promise<CacheEntry> | null = null;
const CACHE_TTL = 30_000;

async function fetchBlockscoutTokenItems(limit = 200): Promise<BlockscoutToken[]> {
  try {
    const res = await fetch(
      `${BLOCKSCOUT_V2}/tokens?type=ERC-20&sort=holders_count&order=desc&limit=${limit}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).filter(
      (t: Record<string, unknown>) => t.address_hash && t.token_type === "ERC-20"
    ) as BlockscoutToken[];
  } catch {
    return [];
  }
}

async function discoverAll(): Promise<CacheEntry> {
  const items = await fetchBlockscoutTokenItems();

  const pairs: DexPair[] = items.map(blockscoutTokenToPair);
  const bestPerToken = new Map<string, DexPair>();
  for (const pair of pairs) {
    const addr = pair.baseToken?.address;
    if (!addr) continue;
    if (!bestPerToken.has(addr)) bestPerToken.set(addr, pair);
  }

  return { pairs, bestPerToken, ts: Date.now() };
}

export async function getRobinhoodTokens(): Promise<CacheEntry> {
  const cached = (globalThis as Record<string, unknown>).__rhTokenCache as CacheEntry | undefined;
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;

  // If a fetch is already in progress, wait for it
  if (cachePromise) return cachePromise;

  cachePromise = discoverAll().then((entry) => {
    // Update module-level cache (safe because JS is single-threaded)
    (globalThis as Record<string, unknown>).__rhTokenCache = entry;
    cachePromise = null;
    return entry;
  }).catch((err) => {
    cachePromise = null;
    throw err;
  });

  return cachePromise;
}

// Synchronous getter for when we know data is fresh
export function getCachedTokens(): CacheEntry | null {
  const cached = (globalThis as Record<string, unknown>).__rhTokenCache as CacheEntry | undefined;
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;
  return null;
}

export async function getLatestBlock(): Promise<number> {
  try {
    const res = await fetch(`${BLOCKSCOUT_V2}/stats`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total_blocks || 0;
  } catch {
    return 0;
  }
}

function tokenToMapped(t: BlockscoutToken): MappedToken {
  const addr = t.address_hash || "";
  return {
    name: t.name || "Unknown",
    symbol: t.symbol || "???",
    address: addr,
    priceUsd: t.exchange_rate || "0",
    priceNative: "0",
    marketCap: Number(t.circulating_market_cap) || 0,
    fdv: Number(t.circulating_market_cap) || 0,
    liquidityUsd: 0,
    volume24h: Number(t.volume_24h) || 0,
    volume6h: 0,
    volume1h: 0,
    volumeM5: 0,
    priceChange24h: 0,
    priceChange1h: 0,
    priceChange6h: 0,
    priceChangeM5: 0,
    buys24h: 0,
    sells24h: 0,
    buys1h: 0,
    sells1h: 0,
    buysM5: 0,
    sellsM5: 0,
    dex: "blockscout",
    pairAddress: "",
    url: `https://robinhoodchain.blockscout.com/token/${addr}`,
    imageUrl: t.icon_url || null,
    pairCreatedAt: 0,
    quoteSymbol: "WETH",
    websites: [],
    socials: [],
  };
}

export async function searchTokens(query: string): Promise<MappedToken[]> {
  const q = query.trim();
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(q);

  if (isAddress) {
    const res = await fetch(`${BLOCKSCOUT_V2}/tokens/${q.toLowerCase()}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const t = (await res.json()) as BlockscoutToken;
    if (!t || !t.address_hash) return [];
    return [tokenToMapped(t)];
  }

  // Symbol/name search via Blockscout
  try {
    const res = await fetch(
      `${BLOCKSCOUT_V2}/tokens?q=${encodeURIComponent(q)}&type=ERC-20`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results: MappedToken[] = [];
    const seen = new Set<string>();
    for (const t of (data.items || []) as BlockscoutToken[]) {
      if (seen.has(t.address_hash)) continue;
      seen.add(t.address_hash);
      results.push(tokenToMapped(t));
    }
    // Sort: market cap first, then volume
    results.sort((a, b) => {
      if (a.marketCap > 0 && b.marketCap > 0) return b.marketCap - a.marketCap;
      if (a.marketCap > 0) return -1;
      if (b.marketCap > 0) return 1;
      return b.volume24h - a.volume24h;
    });
    return results.slice(0, 20);
  } catch {
    return [];
  }
}
