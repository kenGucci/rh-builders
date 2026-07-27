"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Rocket, RefreshCw, Search, Clock, TrendingUp } from "lucide-react";

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
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function ageLabel(ms: number): string {
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export default function NewListingsPage() {
  const [newTokens, setNewTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "volume" | "price">("newest");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-activity");
      const data = await res.json();
      setNewTokens(data.newTokens || []);
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

  const sortedTokens = searchResults
    ? searchResults.tokens
    : [...newTokens].sort((a, b) => {
        if (sortBy === "volume") return b.volume24h - a.volume24h;
        if (sortBy === "price") return Number(b.priceUsd) - Number(a.priceUsd);
        return (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0);
      });

  return (
    <div className="max-w-5xl mx-auto space-y-5 fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Rocket size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">New Listings</h1>
            <p className="text-xs text-[var(--text-muted)]">
              Freshly deployed tokens on Robinhood Chain · {newTokens.length} new in last 24h
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

        {searchResults ? (
          <div className="text-[10px] text-[var(--text-muted)]">
            {searchResults.total} result{searchResults.total !== 1 ? "s" : ""} for &quot;{searchResults.query}&quot;
          </div>
        ) : (
          <div className="flex gap-1">
            {([
              { key: "newest" as const, icon: Clock, label: "Newest" },
              { key: "volume" as const, icon: TrendingUp, label: "By Volume" },
              { key: "price" as const, icon: TrendingUp, label: "By Price" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  sortBy === key
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

      {loading && sortedTokens.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
              <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
            </div>
          ))}
        </div>
      ) : sortedTokens.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          {searchResults ? "No tokens found matching your search" : "No new listings found on Robinhood Chain"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sortedTokens.map((t, i) => {
            const isUp = t.priceChange24h >= 0;
            const ageMs = t.pairCreatedAt ? Date.now() - t.pairCreatedAt : 0;
            const buyRatio = t.buys1h + t.sells1h > 0
              ? Math.round((t.buys1h / (t.buys1h + t.sells1h)) * 100)
              : 50;
            return (
              <a
                key={`${t.address}-${t.pairAddress}`}
                href={`/token/${t.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--surface)] border border-green-500/20 rounded-xl p-3 hover:border-green-500/40 transition-all group fade-in"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.symbol} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center text-[9px] font-bold text-green-400">
                        {t.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold group-hover:text-green-400 transition-colors">{t.symbol}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate max-w-[120px]">{t.name}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-0.5">
                      <Rocket size={7} /> NEW
                    </span>
                    {t.pairCreatedAt > 0 && (
                      <span className="text-[8px] text-[var(--text-muted)]">{ageLabel(ageMs)}</span>
                    )}
                  </div>
                </div>

                <div className="text-sm font-mono font-bold text-[var(--foreground)] mb-1">
                  {formatPrice(t.priceUsd)}
                  {isUp ? (
                    <span className="text-[10px] text-green-400 ml-1">+{t.priceChange1h.toFixed(1)}% 1h</span>
                  ) : (
                    <span className="text-[10px] text-red-400 ml-1">{t.priceChange1h.toFixed(1)}% 1h</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px] mb-2">
                  <div className="text-center">
                    <div className="text-[var(--text-muted)]">Vol 1h</div>
                    <div className="font-mono font-medium">${formatCompact(t.volume1h)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[var(--text-muted)]">Liq</div>
                    <div className="font-mono font-medium">${formatCompact(t.liquidityUsd)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[var(--text-muted)]">MCap</div>
                    <div className="font-mono font-medium">${formatCompact(t.marketCap)}</div>
                  </div>
                </div>

                <div className="h-1 rounded-full bg-red-500/20 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500/60" style={{ width: `${buyRatio}%` }} />
                </div>
                <div className="flex justify-between text-[7px] text-[var(--text-muted)] mt-0.5">
                  <span>{t.buys1h} buys · {t.sells1h} sells (1h)</span>
                  <span>{t.dex}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
