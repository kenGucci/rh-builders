"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Activity, RefreshCw, Search, TrendingUp, Flame, Zap } from "lucide-react";

interface TokenData {
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
}

interface SearchResult {
  query: string;
  tokens: TokenData[];
  total: number;
  lastUpdated: string;
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n === 0) return "0";
  return n.toFixed(2);
}

function formatPrice(price: string): string {
  const n = Number(price);
  if (n < 0.000001) return `$${n.toFixed(10)}`;
  if (n < 0.001) return `$${n.toFixed(8)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${formatCompact(n)}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

type Tab = "trending" | "hot" | "active";

export default function DexActivityPage() {
  const [trending, setTrending] = useState<TokenData[]>([]);
  const [hot, setHot] = useState<TokenData[]>([]);
  const [recentActivity, setRecentActivity] = useState<TokenData[]>([]);
  const [blockNumber, setBlockNumber] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-activity");
      const data = await res.json();
      setTrending(data.trending || []);
      setHot(data.hot || []);
      setRecentActivity(data.recentActivity || []);
      setBlockNumber(data.block_number || 0);
      setTotalTokens(data.totalTokens || 0);
      setLastUpdated(data.lastUpdated || "");
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/token-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    searchTimerRef.current = setTimeout(() => handleSearch(value), 400);
  };

  const tokens = searchResults
    ? searchResults.tokens
    : activeTab === "trending"
    ? trending
    : activeTab === "hot"
    ? hot
    : recentActivity;

  return (
    <div className="max-w-5xl mx-auto space-y-5 fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Activity size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Live Dex Activity</h1>
            <p className="text-xs text-[var(--text-muted)]">
              Robinhood Chain · {totalTokens} tokens · Last block #{blockNumber.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, symbol, or paste CA..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--accent)] text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors flex-shrink-0"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {searchResults && (
          <div className="text-[10px] text-[var(--text-muted)]">
            {searchResults.total} result{searchResults.total !== 1 ? "s" : ""} for &quot;{searchResults.query}&quot;
          </div>
        )}

        {!searchResults && (
          <div className="flex gap-1">
            {([
              { key: "trending" as Tab, icon: TrendingUp, label: "Trending" },
              { key: "hot" as Tab, icon: Flame, label: "Hot" },
              { key: "active" as Tab, icon: Zap, label: "Most Active" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  activeTab === key
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 live-blink" />
            <span className="text-sm font-medium">
              {searchResults ? "Search Results" : activeTab === "trending" ? "Trending" : activeTab === "hot" ? "Hot (High Buy Pressure)" : "Most Active (1h)"}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {tokens.length} token{tokens.length !== 1 ? "s" : ""}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-[9px] text-[var(--text-muted)]">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="divide-y divide-[var(--border)]">
          {loading && tokens.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              </div>
            ))
          ) : tokens.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
              {searchResults ? "No tokens found matching your search" : "No DEX activity found on Robinhood Chain"}
            </div>
          ) : (
            tokens.map((t, i) => {
              const isUp = t.priceChange1h >= 0;
              const totalTxns1h = t.buys1h + t.sells1h;
              const buyRatio = totalTxns1h > 0 ? Math.round((t.buys1h / totalTxns1h) * 100) : 50;
              const totalTxns24h = t.buys24h + t.sells24h;
              return (
                <a
                  key={`${t.address}-${t.pairAddress}`}
                  href={`/token/${t.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors fade-in"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-[10px] text-[var(--text-muted)] w-5 text-right font-mono">
                      {searchResults ? i + 1 : activeTab === "trending" ? i + 1 : ""}
                    </div>
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.symbol} className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-[10px] font-bold text-green-400 flex-shrink-0">
                        {t.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{t.symbol}</span>
                        <span className="text-[9px] text-[var(--text-muted)] truncate hidden sm:inline">{t.name}</span>
                        <span className={`text-[9px] font-mono px-1 py-0.5 rounded flex-shrink-0 ${isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {isUp ? "+" : ""}{t.priceChange1h.toFixed(1)}%
                        </span>
                        {t.pairCreatedAt > Date.now() - 86400000 && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-400">NEW</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-mono">{formatPrice(t.priceUsd)}</span>
                        <span>·</span>
                        <span>Vol ${formatCompact(t.volume24h)}</span>
                        {t.liquidityUsd > 0 && (
                          <>
                            <span>·</span>
                            <span>Liq ${formatCompact(t.liquidityUsd)}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{totalTxns24h} txns</span>
                        {t.pairCreatedAt > 0 && (
                          <>
                            <span>·</span>
                            <span>{timeAgo(t.pairCreatedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="text-green-400">{t.buys1h} buys</span>
                      <span className="text-red-400">{t.sells1h} sells</span>
                    </div>
                    <div className="h-1 w-20 rounded-full bg-red-500/20 overflow-hidden mt-1 ml-auto">
                      <div className="h-full rounded-full bg-green-500/60" style={{ width: `${buyRatio}%` }} />
                    </div>
                    <div className="text-[7px] text-[var(--text-muted)] mt-0.5">{t.dex} · {t.quoteSymbol}</div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
