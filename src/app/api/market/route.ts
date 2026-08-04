import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const cacheHeaders = { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } };

const FMP_BASE = "https://financialmodelingprep.com/api/v3";
const FMP_KEY = process.env.FMP_API_KEY || "";
const FMP_ENABLED = FMP_KEY && FMP_KEY !== "demo" && FMP_KEY.length > 5;

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  SATS: "ECHO",
};

function yahooSymbol(symbol: string): string {
  return YAHOO_SYMBOL_MAP[symbol] || symbol;
}

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number | null;
  marketCap: number | null;
  pe: number | null;
  week52High: number;
  week52Low: number;
  marketState: string;
  currency: string;
  category: "stock" | "crypto";
  exchange: string;
  timestamp: number;
  sparkline: number[];
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartData {
  symbol: string;
  currency: string;
  range: string;
  interval: string;
  candles: Candle[];
  meta: {
    regularMarketPrice: number | null;
    chartPreviousClose: number | null;
    marketState: string | null;
  };
}

const CRYPTO_KEYWORDS = new Set([
  "BTCUSD", "ETHUSD", "SOLUSD", "DOGEUSD", "XRPUSD", "ADAUSD",
  "AVAXUSD", "DOTUSD", "LINKUSD", "MATICUSD", "SHIBUSD", "LTCUSD",
  "BCHUSD", "ATOMUSD", "UNIUSD", "FILUSD", "APTUSD", "ARBUSD",
  "OPUSD", "NEARUSD", "INJUSD", "SUIUSD", "PEPEUSD", "WIFUSD",
  "BONKUSD", "FLOKIUSD", "CROUSD", "HBARUSD", "VETUSD", "ALGOUSD",
  "BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD",
]);

function isCryptoSymbol(symbol: string): boolean {
  const u = symbol.toUpperCase();
  if (CRYPTO_KEYWORDS.has(u)) return true;
  if (u.endsWith("-USD")) return true;
  if (u.endsWith("USD") && !u.includes(".") && u.length <= 10) return true;
  return false;
}

function mapYahooChart(data: Record<string, unknown>, fallbackSymbol: string): MarketQuote | null {
  const chart = data.chart as Record<string, unknown> | undefined;
  const results = chart?.result as Record<string, unknown>[] | undefined;
  if (!results || !results[0]) return null;

  const r = results[0] as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown>;
  const indicators = r.indicators as Record<string, unknown>;
  const quoteArr = indicators?.quote as Record<string, unknown>[] | undefined;
  const quotes = quoteArr?.[0] as Record<string, unknown> | undefined;

  const price = Number(meta.regularMarketPrice) || 0;
  const prevClose = Number(meta.chartPreviousClose) || Number(meta.previousClose) || price;
  const change = price - prevClose;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

  const closes = (quotes?.close as (number | null)[] | undefined)?.filter((v): v is number => v != null) || [];
  const sparkline = closes.slice(-30);

  const symbol = String(meta.symbol || fallbackSymbol);
  const state = String(meta.marketState || "REGULAR");

  return {
    symbol,
    name: "",
    price,
    change,
    changePercent: changePct,
    previousClose: prevClose,
    open: Number(meta.regularMarketOpen) || (closes.length > 0 ? closes[0] : price),
    dayHigh: Number(meta.regularMarketDayHigh) || (closes.length > 0 ? Math.max(...closes, price) : price),
    dayLow: Number(meta.regularMarketDayLow) || (closes.length > 0 ? Math.min(...closes, price) : price),
    volume: Number(meta.regularMarketVolume) || 0,
    avgVolume: null,
    marketCap: Number(meta.marketCap) || null,
    pe: null,
    week52High: Number(meta.fiftyTwoWeekHigh) || (closes.length > 0 ? Math.max(...closes, price) : price),
    week52Low: Number(meta.fiftyTwoWeekLow) || (closes.length > 0 ? Math.min(...closes, price) : price),
    sparkline,
    marketState: state,
    currency: String(meta.currency || "USD"),
    category: isCryptoSymbol(symbol) ? "crypto" : "stock",
    exchange: String(meta.fullExchangeName || meta.exchangeName || ""),
    timestamp: Number(meta.regularMarketTime) || Math.floor(Date.now() / 1000),
  };
}

async function yahooFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Yahoo error: ${res.status}`);
  return res.json();
}

async function yahooSparkline(symbol: string): Promise<number[]> {
  try {
    const data = await yahooFetch(
      `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?interval=1d&range=1w`
    );
    const mapped = mapYahooChart(data as Record<string, unknown>, symbol);
    return mapped?.sparkline || [];
  } catch {
    return [];
  }
}

async function yahooQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const data = await yahooFetch(
      `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?interval=1d&range=1w`
    );
    const mapped = mapYahooChart(data as Record<string, unknown>, symbol);
    return mapped;
  } catch {
    return null;
  }
}

const RANGE_INTERVALS: Record<string, { interval: string }> = {
  "1d": { interval: "5m" },
  "5d": { interval: "15m" },
  "1mo": { interval: "1d" },
  "3mo": { interval: "1d" },
  "6mo": { interval: "1d" },
  "1y": { interval: "1d" },
  "2y": { interval: "1wk" },
  "5y": { interval: "1wk" },
  "max": { interval: "1mo" },
};

async function yahooChart(symbol: string, range: string): Promise<ChartData | null> {
  try {
    const conf = RANGE_INTERVALS[range] || RANGE_INTERVALS["3mo"];
    const data = await yahooFetch(
      `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?interval=${conf.interval}&range=${range}&includePrePost=false`
    );
    const d = data as Record<string, unknown>;
    const chartBlock = d.chart as Record<string, unknown> | undefined;
    const result = (chartBlock?.result as Record<string, unknown>[] | undefined)?.[0];
    if (!result) return null;

    const meta = result.meta as Record<string, unknown>;
    const timestamps = (result.timestamp as number[] | undefined) || [];
    const quote = ((result.indicators as Record<string, unknown> | undefined)?.quote as Record<string, unknown>[] | undefined)?.[0] || {};

    const opens = quote.open as (number | null)[] | undefined || [];
    const highs = quote.high as (number | null)[] | undefined || [];
    const lows = quote.low as (number | null)[] | undefined || [];
    const closes = quote.close as (number | null)[] | undefined || [];
    const volumes = quote.volume as (number | null)[] | undefined || [];

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c == null) continue;
      const o = opens[i] ?? c;
      const h = highs[i] ?? c;
      const l = lows[i] ?? c;
      const v = volumes[i] ?? 0;
      candles.push({ time: timestamps[i], open: o, high: h, low: l, close: c, volume: v });
    }

    return {
      symbol: String(meta.symbol || symbol),
      currency: String(meta.currency || "USD"),
      range,
      interval: conf.interval,
      candles,
      meta: {
        regularMarketPrice: typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : null,
        chartPreviousClose: typeof meta.chartPreviousClose === "number" ? meta.chartPreviousClose : null,
        marketState: typeof meta.marketState === "string" ? meta.marketState : null,
      },
    };
  } catch {
    return null;
  }
}

async function yahooBatch(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0) return [];
  const results: (MarketQuote | null)[] = new Array(symbols.length).fill(null);
  let cursor = 0;
  const workerCount = Math.min(8, symbols.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= symbols.length) return;
      results[idx] = await cachedYahooQuote(symbols[idx]);
    }
  });
  await Promise.all(workers);
  return results.filter((r): r is MarketQuote => r !== null);
}

async function yahooBatchCharts(symbols: string[], range: string): Promise<Record<string, ChartData>> {
  const out: Record<string, ChartData> = {};
  let cursor = 0;
  const workerCount = Math.min(6, symbols.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= symbols.length) return;
      const chart = await cachedYahooChart(symbols[idx], range);
      if (chart && chart.candles.length > 0) out[symbols[idx]] = chart;
    }
  });
  await Promise.all(workers);
  return out;
}

async function yahooSearch(query: string): Promise<SearchResult[]> {
  try {
    const data = await yahooFetch(
      `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=12&newsCount=0`
    );
    const d = data as Record<string, unknown>;
    const quotes = d.quotes as Record<string, unknown>[] | undefined;
    if (!quotes) return [];
    return quotes.map((q) => ({
      symbol: String(q.symbol || ""),
      name: String(q.shortname || q.longname || q.symbol || ""),
      type: String(q.quoteType || q.typeDisp || "Equity"),
      exchange: String(q.exchDisp || q.exchange || ""),
    }));
  } catch {
    return [];
  }
}

async function yahooGainersLosers(): Promise<{ gainers: MarketQuote[]; losers: MarketQuote[] }> {
  try {
    const [gainersData, losersData] = await Promise.allSettled([
      yahooFetch(`${YAHOO_BASE}/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=10`),
      yahooFetch(`${YAHOO_BASE}/v1/finance/screener/predefined/saved?scrIds=day_losers&count=10`),
    ]);

    function extractQuotes(result: PromiseSettledResult<unknown>): MarketQuote[] {
      if (result.status !== "fulfilled") return [];
      const d = result.value as Record<string, unknown>;
      const finance = d.finance as Record<string, unknown> | undefined;
      const resArr = finance?.result as Record<string, unknown>[] | undefined;
      if (!resArr || !resArr[0]) return [];
      const quotes = (resArr[0] as Record<string, unknown>).quotes as Record<string, unknown>[] | undefined;
      if (!quotes) return [];
      return quotes.map((q) => {
        const price = Number(q.regularMarketPrice) || 0;
        const prev = Number(q.regularMarketPreviousClose) || price;
        return {
          symbol: String(q.symbol || ""),
          name: String(q.shortName || q.longName || q.symbol || ""),
          price,
          change: Number(q.regularMarketChange) || price - prev,
          changePercent: Number(q.regularMarketChangePercent) || 0,
          previousClose: prev,
          open: Number(q.regularMarketOpen) || price,
          dayHigh: Number(q.regularMarketDayHigh) || price,
          dayLow: Number(q.regularMarketDayLow) || price,
          volume: Number(q.regularMarketVolume) || 0,
          avgVolume: Number(q.averageDailyVolume3Month) || null,
          marketCap: Number(q.marketCap) || null,
          pe: Number(q.epsTrailingTwelveMonths) || null,
          week52High: Number(q.fiftyTwoWeekHigh) || price,
          week52Low: Number(q.fiftyTwoWeekLow) || price,
          sparkline: [],
          marketState: String(q.marketState || "REGULAR"),
          currency: "USD",
          category: "stock" as const,
          exchange: String(q.exchange || ""),
          timestamp: Math.floor(Date.now() / 1000),
        };
      });
    }

    return {
      gainers: extractQuotes(gainersData),
      losers: extractQuotes(losersData),
    };
  } catch {
    return { gainers: [], losers: [] };
  }
}

async function fmpQuote(symbol: string): Promise<MarketQuote | null> {
  if (!FMP_ENABLED) return null;
  try {
    const res = await fetch(`${FMP_BASE}/quote/${symbol}?apikey=${FMP_KEY}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const q = data[0] as Record<string, unknown>;
    const price = Number(q.price) || 0;
    const prev = Number(q.previousClose) || price;
    const sparkline = await yahooSparkline(symbol);
    return {
      symbol: String(q.symbol || symbol),
      name: String(q.name || symbol),
      price,
      change: Number(q.change) || price - prev,
      changePercent: Number(q.changesPercentage) || (prev > 0 ? ((price - prev) / prev) * 100 : 0),
      previousClose: prev,
      open: Number(q.open) || price,
      dayHigh: Number(q.dayHigh) || price,
      dayLow: Number(q.dayLow) || price,
      volume: Number(q.volume) || 0,
      avgVolume: Number(q.avgVolume) || null,
      marketCap: Number(q.marketCap) || null,
      pe: Number(q.pe) || null,
      week52High: Number(q.yearHigh) || Number(q.week52High) || price,
      week52Low: Number(q.yearLow) || Number(q.week52Low) || price,
      sparkline,
      marketState: "REGULAR",
      currency: "USD",
      category: isCryptoSymbol(symbol) ? "crypto" : "stock",
      exchange: String(q.exchangeShortName || ""),
      timestamp: Number(q.timestamp) || Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

async function fmpSearch(query: string): Promise<SearchResult[]> {
  if (!FMP_ENABLED) return [];
  try {
    const res = await fetch(`${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=12&apikey=${FMP_KEY}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: Record<string, unknown>) => ({
      symbol: String(item.symbol || ""),
      name: String(item.name || ""),
      type: String(item.type || "stock"),
      exchange: String(item.exchangeShortName || ""),
    }));
  } catch {
    return [];
  }
}

async function fmpGainersLosers(): Promise<{ gainers: MarketQuote[]; losers: MarketQuote[] }> {
  if (!FMP_ENABLED) return { gainers: [], losers: [] };
  try {
    const [g, l] = await Promise.allSettled([
      fetch(`${FMP_BASE}/stock_market/gainers?limit=10&apikey=${FMP_KEY}`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
      fetch(`${FMP_BASE}/stock_market/losers?limit=10&apikey=${FMP_KEY}`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
    ]);
    function map(items: unknown): MarketQuote[] {
      if (!Array.isArray(items)) return [];
      return items.map((q: Record<string, unknown>) => {
        const price = Number(q.price) || 0;
        const prev = Number(q.previousClose) || price;
        return {
          symbol: String(q.symbol || ""),
          name: String(q.name || q.companyName || ""),
          price,
          change: Number(q.change) || price - prev,
          changePercent: Number(q.changesPercentage) || 0,
          previousClose: prev,
          open: Number(q.open) || price,
          dayHigh: Number(q.dayHigh) || price,
          dayLow: Number(q.dayLow) || price,
          volume: Number(q.volume) || 0,
          avgVolume: null,
          marketCap: Number(q.marketCap) || null,
          pe: null,
          week52High: Number(q.week52High) || price,
          week52Low: Number(q.week52Low) || price,
          sparkline: [],
          marketState: "REGULAR",
          currency: "USD",
          category: isCryptoSymbol(String(q.symbol || "")) ? "crypto" as const : "stock" as const,
          exchange: String(q.exchangeShortName || ""),
          timestamp: Math.floor(Date.now() / 1000),
        };
      });
    }
    return { gainers: map(g.status === "fulfilled" ? g.value : []), losers: map(l.status === "fulfilled" ? l.value : []) };
  } catch {
    return { gainers: [], losers: [] };
  }
}

const WATCHLIST = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AMD",
  "BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD",
];

const NAME_MAP: Record<string, string> = {
  AAPL: "Apple Inc.", MSFT: "Microsoft", GOOGL: "Alphabet", AMZN: "Amazon",
  NVDA: "NVIDIA", TSLA: "Tesla", META: "Meta Platforms", AMD: "AMD",
  "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum", "SOL-USD": "Solana", "DOGE-USD": "Dogecoin",
};

// ─── In-memory cache (charts, quotes, trades) to survive rapid-fire card loads ───
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: unknown; expires: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function cacheSet(key: string, value: unknown, ttl = CACHE_TTL_MS) {
  cache.set(key, { value, expires: Date.now() + ttl });
  if (cache.size > 400) {
    const now = Date.now();
    for (const [k, v] of cache) if (now > v.expires) cache.delete(k);
  }
}

async function cachedYahooChart(symbol: string, range: string): Promise<ChartData | null> {
  const key = `chart:${symbol}:${range}`;
  const cached = cacheGet<ChartData | null>(key);
  if (cached !== null) return cached;
  const chart = await yahooChart(symbol, range);
  cacheSet(key, chart);
  return chart;
}

async function cachedYahooQuote(symbol: string): Promise<MarketQuote | null> {
  const key = `quote:${symbol}`;
  const cached = cacheGet<MarketQuote | null>(key);
  if (cached !== null) return cached;
  const quote = await yahooQuote(symbol);
  if (quote) cacheSet(key, quote);
  return quote;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "quotes";
  const symbol = request.nextUrl.searchParams.get("symbol");
  const query = request.nextUrl.searchParams.get("query");
  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  const category = request.nextUrl.searchParams.get("category") || "all";

  try {
    if (action === "search" && query) {
      const [yahooResults, fmpResults] = await Promise.allSettled([
        yahooSearch(query),
        fmpSearch(query),
      ]);
      const yahoo = yahooResults.status === "fulfilled" ? yahooResults.value : [];
      const fmp = fmpResults.status === "fulfilled" ? fmpResults.value : [];
      const seen = new Set<string>();
      const merged: SearchResult[] = [];
      for (const r of [...yahoo, ...fmp]) {
        if (!seen.has(r.symbol)) {
          seen.add(r.symbol);
          merged.push(r);
        }
      }
      return NextResponse.json({ results: merged }, cacheHeaders);
    }

    if (action === "quote" && symbol) {
      let quote = await yahooQuote(symbol);
      if (!quote) quote = await fmpQuote(symbol);
      if (!quote) return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
      return NextResponse.json({ quote }, cacheHeaders);
    }

    if (action === "chart" && symbol) {
      const range = request.nextUrl.searchParams.get("range") || "3mo";
      const chart = await cachedYahooChart(symbol, range);
      if (!chart || chart.candles.length === 0) {
        return NextResponse.json({ error: "No chart data" }, { status: 404 });
      }
      return NextResponse.json({ chart }, cacheHeaders);
    }

    if (action === "charts" && symbolsParam) {
      const range = request.nextUrl.searchParams.get("range") || "3mo";
      const syms = symbolsParam.split(",").filter(Boolean);
      const charts = await yahooBatchCharts(syms, range);
      return NextResponse.json({ charts }, cacheHeaders);
    }

    if (action === "batch" && symbolsParam) {
      const syms = symbolsParam.split(",").filter(Boolean);
      let quotes = await yahooBatch(syms);
      if (quotes.length === 0 && FMP_ENABLED) {
        const results = await Promise.allSettled(syms.map((s) => fmpQuote(s)));
        quotes = results
          .filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);
      }
      return NextResponse.json({ quotes }, cacheHeaders);
    }

    if (action === "gainers-losers") {
      const fmpGL = await fmpGainersLosers();
      if (fmpGL.gainers.length > 0 || fmpGL.losers.length > 0) {
        return NextResponse.json(fmpGL, cacheHeaders);
      }
      const yahooGL = await yahooGainersLosers();
      return NextResponse.json(yahooGL, cacheHeaders);
    }

    if (action === "movers") {
      const fmpGL = await fmpGainersLosers();
      if (fmpGL.gainers.length > 0) {
        return NextResponse.json({ movers: fmpGL.gainers }, cacheHeaders);
      }
      const yahooGL = await yahooGainersLosers();
      return NextResponse.json({ movers: yahooGL.gainers }, cacheHeaders);
    }

    if (action === "quotes") {
      const symbols = WATCHLIST;
      let quotes = await yahooBatch(symbols);
      if (quotes.length === 0 && FMP_ENABLED) {
        const results = await Promise.allSettled(symbols.map((s) => fmpQuote(s)));
        quotes = results
          .filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);
      }
      for (const q of quotes) {
        if (!q.name || q.name === q.symbol) {
          q.name = NAME_MAP[q.symbol] || q.symbol;
        }
      }

      const filtered = category === "all" ? quotes : quotes.filter((q) => q.category === category);

      const gainers = quotes.filter((q) => q.changePercent > 0).length;
      const losers = quotes.filter((q) => q.changePercent < 0).length;
      const unchanged = quotes.filter((q) => q.changePercent === 0).length;
      const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
      const topGainer = sorted[0] || null;
      const topLoser = sorted[sorted.length - 1] || null;

      return NextResponse.json({
        quotes: filtered,
        summary: {
          totalAssets: quotes.length,
          gainers,
          losers,
          unchanged,
          topGainer: topGainer ? { symbol: topGainer.symbol, name: topGainer.name, changePercent: topGainer.changePercent, price: topGainer.price } : null,
          topLoser: topLoser ? { symbol: topLoser.symbol, name: topLoser.name, changePercent: topLoser.changePercent, price: topLoser.price } : null,
          lastUpdated: new Date().toISOString(),
        },
      }, cacheHeaders);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({
      error: "Failed to fetch market data",
    }, { status: 500 });
  }
}
