import type { StockToken } from "@/lib/stock-tokens";

const RHJ_BASE = "https://api.robinhood.com/rhj";
const CHAIN_ID = 4663;

export interface RhjAsset {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  deployments: Array<{ contractAddress: string; chainId: number }>;
  currentMultiplier: string;
  pendingMultiplier: string;
  status: string;
  logoUrl: string;
}

export interface RhjQuote {
  tokenSymbol: string;
  bid: string;
  ask: string;
  currency: string;
  dailyTradingVolume: string;
  isTradingHalt: boolean;
  generatedAt: string;
  dailyHigh: string;
  dailyLow: string;
  mintBurnTokenVolume: string;
  mintBurnUsdVolume: string;
}

let assetsCache: { assets: RhjAsset[]; ts: number } | null = null;
const ASSETS_TTL = 10 * 60_000;

let pricesCache: { quotes: Record<string, RhjQuote>; ts: number } | null = null;
const PRICES_TTL = 30_000;

export function rhjSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/-.*$/, "").replace(/\./, "");
}

export async function getRhjAssets(): Promise<RhjAsset[]> {
  if (assetsCache && Date.now() - assetsCache.ts < ASSETS_TTL) {
    return assetsCache.assets;
  }
  try {
    const res = await fetch(`${RHJ_BASE}/assets`, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`RHJ assets ${res.status}`);
    const data = (await res.json()) as { assets?: RhjAsset[] };
    const assets = (data.assets || []).filter((a) =>
      a.deployments?.some((d) => d.chainId === CHAIN_ID)
    );
    assetsCache = { assets, ts: Date.now() };
    return assets;
  } catch {
    return assetsCache?.assets || [];
  }
}

export function assetToStockToken(a: RhjAsset): StockToken {
  const deployment = a.deployments.find((d) => d.chainId === CHAIN_ID);
  const symbol = a.tokenSymbol;
  const name = a.tokenName
    .replace(/\s*•\s*Robinhood Token.*$/i, "")
    .replace(/\s*(Class [ABC]\s+)?(Common Stock|American Depositary Shares|Shares?)\s*$/i, "")
    .trim();
  const isETF = /ETF|Trust|Fund|Index/i.test(a.tokenName);
  return {
    symbol,
    name: name || symbol,
    sector: isETF ? "ETF" : "Stocks",
    chain: "Robinhood Chain",
    multiplier: Number(a.currentMultiplier) || 1,
    backed: a.status === "ASSET_STATUS_ACTIVE",
    custodian: "Robinhood Custody",
    tokenAddress: deployment?.contractAddress || "",
    apy: 0,
    tvl: 0,
  };
}

export async function getRhjQuotes(symbols: string[]): Promise<Record<string, RhjQuote>> {
  if (symbols.length === 0) return {};
  if (pricesCache && Date.now() - pricesCache.ts < PRICES_TTL) {
    return pricesCache.quotes;
  }
  const map: Record<string, RhjQuote> = {};
  let cursor = 0;
  const workerCount = Math.min(10, symbols.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= symbols.length) return;
      const sym = symbols[idx];
      try {
        const res = await fetch(`${RHJ_BASE}/prices/${encodeURIComponent(sym)}`, {
          signal: AbortSignal.timeout(8000),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { quotes?: RhjQuote[] };
        const q = data.quotes?.[0];
        if (q) map[sym] = q;
      } catch {}
    }
  });
  await Promise.all(workers);
  if (Object.keys(map).length > 0) {
    pricesCache = { quotes: map, ts: Date.now() };
  }
  return map;
}
