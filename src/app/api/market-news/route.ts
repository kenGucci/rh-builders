import { NextResponse } from "next/server";

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const NEWS_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "AMD",
  "COIN", "PLTR", "NFLX", "QQQ", "SPY", "BTC-USD", "ETH-USD",
];

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  publisher: string;
  link: string;
  thumbnail: string | null;
  symbol: string;
  publishedAt: number;
}

interface NewsEntry {
  title?: string;
  link?: string;
  publisher?: string;
  providerPublishTime?: number;
  type?: string;
  thumbnail?: { resolutions?: { url?: string }[] };
}

const CACHE_TTL = 60_000;
let cache: { data: MarketNewsItem[]; timestamp: number } | null = null;

async function yahooFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`Yahoo error: ${res.status}`);
  return res.json();
}

async function fetchSymbolNews(symbol: string): Promise<MarketNewsItem[]> {
  try {
    const data = await yahooFetch(
      `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=3`
    );
    const d = data as Record<string, unknown>;
    const news = (d.news as NewsEntry[] | undefined) || [];
    return news
      .filter((n) => n.title && n.link)
      .map((n) => ({
        id: n.link as string,
        title: (n.title as string).slice(0, 160),
        summary: "",
        publisher: n.publisher || "Yahoo Finance",
        link: n.link as string,
        thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
        symbol,
        publishedAt: Number(n.providerPublishTime) || Math.floor(Date.now() / 1000),
      }));
  } catch {
    return [];
  }
}

async function collectNews(): Promise<MarketNewsItem[]> {
  const settled = await Promise.allSettled(NEWS_SYMBOLS.map((s) => fetchSymbolNews(s)));
  const seen = new Set<string>();
  const merged: MarketNewsItem[] = [];

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.publishedAt - a.publishedAt);
  return merged.slice(0, 16);
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ news: cache.data, cached: true, updatedAt: cache.timestamp });
  }

  const news = await collectNews();
  cache = { data: news, timestamp: Date.now() };

  if (news.length === 0) {
    return NextResponse.json({ news: [], cached: false, updatedAt: Date.now() });
  }

  return NextResponse.json({ news, cached: false, updatedAt: Date.now() });
}
