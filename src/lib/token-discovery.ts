const DEXSCREENER_API = "https://api.dexscreener.com";
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

export function mapPair(pair: DexPair): MappedToken {
  return {
    name: pair.baseToken?.name || "Unknown",
    symbol: pair.baseToken?.symbol || "???",
    address: pair.baseToken?.address || "",
    priceUsd: pair.priceUsd || "0",
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
const CACHE_TTL = 20_000;

async function fetchBlockscoutTokens(): Promise<string[]> {
  try {
    const res = await fetch(
      `${BLOCKSCOUT_V2}/tokens?sort=holders_count&order=desc&limit=200`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || [])
      .filter((t: Record<string, unknown>) => t.address_hash && t.token_type === "ERC-20")
      .map((t: Record<string, unknown>) => t.address_hash as string);
  } catch {
    return [];
  }
}

async function fetchDexScreenerSearch(): Promise<DexPair[]> {
  const terms = ["robinhood", "hood", "robin", "rh chain"];
  const results = await Promise.allSettled(
    terms.map(async (term) => {
      const res = await fetch(`${DEXSCREENER_API}/latest/dex/search?q=${term}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.pairs || []).filter(
        (p: DexPair) => p.chainId === "robinhood" && p.baseToken?.address
      );
    })
  );

  const pairs: DexPair[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") pairs.push(...r.value);
  }
  return pairs;
}

async function fetchDexScreenerBatch(addresses: string[]): Promise<DexPair[]> {
  if (addresses.length === 0) return [];
  const res = await fetch(`${DEXSCREENER_API}/latest/dex/tokens/${addresses.join(",")}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.pairs || []).filter((p: DexPair) => p.chainId === "robinhood");
}

async function discoverAll(): Promise<CacheEntry> {
  // Fetch Blockscout tokens and DexScreener search results in parallel
  const [blockscoutAddrs, searchPairs] = await Promise.all([
    fetchBlockscoutTokens(),
    fetchDexScreenerSearch(),
  ]);

  // Merge all unique addresses
  const addressSet = new Set<string>(blockscoutAddrs);
  for (const p of searchPairs) {
    if (p.baseToken?.address) addressSet.add(p.baseToken.address);
  }

  // Also add addresses from search pairs directly
  const allPairs: DexPair[] = [...searchPairs];
  const seenPairs = new Set<string>(searchPairs.map((p) => p.pairAddress));

  // Batch-fetch DexScreener data for all addresses (parallel batches of 30)
  const addresses = Array.from(addressSet);
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    batches.push(addresses.slice(i, i + 30));
  }

  const batchResults = await Promise.allSettled(
    batches.map((batch) => fetchDexScreenerBatch(batch))
  );

  for (const result of batchResults) {
    if (result.status === "fulfilled") {
      for (const pair of result.value) {
        if (!seenPairs.has(pair.pairAddress)) {
          seenPairs.add(pair.pairAddress);
          allPairs.push(pair);
        }
      }
    }
  }

  // Deduplicate: keep best pair per token (highest liquidity)
  const bestPerToken = new Map<string, DexPair>();
  for (const pair of allPairs) {
    const addr = pair.baseToken?.address;
    if (!addr) continue;
    const existing = bestPerToken.get(addr);
    if (!existing || (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)) {
      bestPerToken.set(addr, pair);
    }
  }

  return { pairs: allPairs, bestPerToken, ts: Date.now() };
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

export async function searchTokens(query: string): Promise<MappedToken[]> {
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);

  if (isAddress) {
    // Parallel: DexScreener + Blockscout
    const [dexRes, bsRes] = await Promise.allSettled([
      fetch(`${DEXSCREENER_API}/latest/dex/tokens/${query.toLowerCase()}`, {
        signal: AbortSignal.timeout(6000),
      }).then((r) => r.ok ? r.json() : null),
      fetch(`${BLOCKSCOUT_V2}/tokens/${query.toLowerCase()}`, {
        signal: AbortSignal.timeout(6000),
      }).then((r) => r.ok ? r.json() : null),
    ]);

    const results: MappedToken[] = [];

    if (dexRes.status === "fulfilled" && dexRes.value) {
      results.push(
        ...(dexRes.value.pairs || [])
          .filter((p: DexPair) => p.chainId === "robinhood")
          .map(mapPair)
      );
    }

    if (results.length === 0 && bsRes.status === "fulfilled" && bsRes.value) {
      const t = bsRes.value;
      results.push({
        name: t.name || "Unknown",
        symbol: t.symbol || "???",
        address: t.address || query.toLowerCase(),
        priceUsd: t.exchange_rate || "0",
        marketCap: t.market_cap || 0,
        fdv: t.fdv || 0,
        liquidityUsd: 0,
        volume24h: 0,
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
        url: `https://robinhoodchain.blockscout.com/token/${query.toLowerCase()}`,
        imageUrl: t.icon_url || null,
        pairCreatedAt: 0,
        quoteSymbol: "WETH",
        websites: [],
        socials: [],
      });
    }

    return results;
  }

  // Symbol/name search: parallel DexScreener + Blockscout
  const [dexRes, bsRes] = await Promise.allSettled([
    fetch(`${DEXSCREENER_API}/latest/dex/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000),
    }).then((r) => r.ok ? r.json() : null),
    fetch(`${BLOCKSCOUT_V2}/tokens?q=${encodeURIComponent(query)}&type=ERC-20`, {
      signal: AbortSignal.timeout(6000),
    }).then((r) => r.ok ? r.json() : null),
  ]);

  const results: MappedToken[] = [];
  const seen = new Set<string>();

  if (dexRes.status === "fulfilled" && dexRes.value) {
    for (const pair of dexRes.value.pairs || []) {
      if (pair.chainId !== "robinhood") continue;
      const addr = pair.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      results.push(mapPair(pair));
    }
  }

  if (bsRes.status === "fulfilled" && bsRes.value) {
    for (const t of bsRes.value.items || []) {
      if (seen.has(t.address)) continue;
      seen.add(t.address);
      results.push({
        name: t.name || "Unknown",
        symbol: t.symbol || "???",
        address: t.address || "",
        priceUsd: t.exchange_rate || "0",
        marketCap: t.market_cap || 0,
        fdv: t.fdv || 0,
        liquidityUsd: 0,
        volume24h: 0,
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
        url: `https://robinhoodchain.blockscout.com/token/${t.address}`,
        imageUrl: t.icon_url || null,
        pairCreatedAt: 0,
        quoteSymbol: "WETH",
        websites: [],
        socials: [],
      });
    }
  }

  // Sort: liquidity first, then volume
  results.sort((a, b) => {
    if (a.liquidityUsd > 0 && b.liquidityUsd > 0) return b.liquidityUsd - a.liquidityUsd;
    if (a.liquidityUsd > 0) return -1;
    if (b.liquidityUsd > 0) return 1;
    return b.volume24h - a.volume24h;
  });

  return results.slice(0, 20);
}
