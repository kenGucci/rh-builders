"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, RefreshCw, Search, ArrowUpDown, ChevronDown } from "lucide-react";

interface DexToken {
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
  dex: string;
  pairAddress: string;
  url: string;
  imageUrl: string | null;
  pairCreatedAt: number;
  quoteSymbol: string;
}

interface DexScreenerResponse {
  tokens: DexToken[];
  lastUpdated: string;
  totalTokens: number;
}

interface SearchResult {
  query: string;
  tokens: DexToken[];
  total: number;
}

type SortKey = "volume" | "price" | "liquidity" | "change" | "newest";

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

export default function RobinhoodTokensPage() {
  const [tokens, setTokens] = useState<DexToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [totalTokens, setTotalTokens] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("volume");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dex-screener?sort=${sortBy}&limit=50`);
      const data: DexScreenerResponse = await res.json();
      setTokens(data.tokens || []);
      setLastUpdated(data.lastUpdated || "");
      setTotalTokens(data.totalTokens || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const displayTokens = searchResults ? searchResults.tokens : tokens;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "volume", label: "Volume 24h" },
    { key: "price", label: "Price" },
    { key: "liquidity", label: "Liquidity" },
    { key: "change", label: "Price Change" },
    { key: "newest", label: "Newest" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Robinhood Chain Tokens</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {totalTokens} tokens discovered · Blockscout + DexScreener
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

          <div className="relative flex-shrink-0" ref={sortMenuRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors"
            >
              <ArrowUpDown size={12} />
              {sortOptions.find((s) => s.key === sortBy)?.label}
              <ChevronDown size={10} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                      sortBy === opt.key
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
          <div className="text-[10px] text-[var(--text-muted)]">
            {tokens.length} tokens · Sorted by {sortOptions.find((s) => s.key === sortBy)?.label}
          </div>
        )}
      </div>

      {loading && displayTokens.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
              <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
            </div>
          ))}
        </div>
      ) : displayTokens.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          {searchResults ? "No tokens found matching your search" : "No tokens found on Robinhood Chain"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {displayTokens.map((t, i) => {
            const isUp = t.priceChange24h >= 0;
          const buyRatio = t.buys24h + t.sells24h > 0
            ? Math.round((t.buys24h / (t.buys24h + t.sells24h)) * 100)
            : 50;
          const isNew = t.pairCreatedAt > Date.now() - 86400000;
          return (
            <a
              key={`${t.address}-${t.pairAddress}`}
              href={`/token/${t.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-[var(--surface)] border rounded-xl p-3 hover:border-[var(--accent)]/30 transition-all group fade-in ${
                isNew ? "border-green-500/20" : "border-[var(--border)]"
              }`}
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.symbol} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[8px] font-bold text-[var(--accent)]">
                      {t.symbol?.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold truncate max-w-[100px] group-hover:text-[var(--accent)] transition-colors">
                      {t.symbol}
                    </div>
                    <div className="text-[8px] text-[var(--text-muted)] truncate max-w-[100px]">{t.name}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {isNew && (
                    <span className="text-[7px] px-1 py-0.5 rounded bg-green-500/10 text-green-400">NEW</span>
                  )}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {isUp ? "+" : ""}{t.priceChange24h.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="text-sm font-mono font-bold text-[var(--foreground)] mb-1.5">
                {formatPrice(t.priceUsd)}
                {t.priceChange1h !== 0 && (
                  <span className={`text-[9px] ml-1 ${t.priceChange1h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.priceChange1h >= 0 ? "+" : ""}{t.priceChange1h.toFixed(1)}% 1h
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">MCap</span>
                  <span className="font-mono">${formatCompact(t.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Liq</span>
                  <span className="font-mono">${formatCompact(t.liquidityUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Vol 24h</span>
                  <span className="font-mono">${formatCompact(t.volume24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Vol 1h</span>
                  <span className="font-mono">${formatCompact(t.volume1h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Buys 24h</span>
                  <span className="font-mono text-green-400">{t.buys24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Sells 24h</span>
                  <span className="font-mono text-red-400">{t.sells24h}</span>
                </div>
              </div>

              <div className="mt-2 h-1 rounded-full bg-red-500/20 overflow-hidden">
                <div className="h-full rounded-full bg-green-500/60" style={{ width: `${buyRatio}%` }} />
              </div>
              <div className="flex justify-between text-[7px] text-[var(--text-muted)] mt-0.5">
                <span>Buy {buyRatio}%</span>
                <span>Sell {100 - buyRatio}%</span>
              </div>

              <div className="text-[7px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                <span className="text-[var(--accent)]">{t.dex}</span>
                <span>·</span>
                <span>{t.quoteSymbol} pair</span>
              </div>
            </a>
          );
        })}
        </div>
      )}
    </div>
  );
}
