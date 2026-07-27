"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, ArrowUpRight, Activity,
  BarChart3, DollarSign, Zap, Clock, Flame, ArrowDownRight, X,
  ChevronRight, Loader2, Wifi,
} from "lucide-react";

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

interface MarketSummary {
  totalAssets: number;
  gainers: number;
  losers: number;
  unchanged: number;
  topGainer: { symbol: string; name: string; changePercent: number; price: number } | null;
  topLoser: { symbol: string; name: string; changePercent: number; price: number } | null;
  lastUpdated: string;
}

function formatPrice(p: number): string {
  if (p >= 10000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (p >= 100) return `$${p.toFixed(2)}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString();
}

function formatMarketCap(cap: number | null): string {
  if (!cap) return "—";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const svg = useMemo(() => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 32;
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: 2 + ((max - v) / range) * (h - 4),
    }));
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = curr.x - (curr.x - prev.x) / 3;
      line += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const fill = line + ` L ${w} ${h} L 0 ${h} Z`;
    const gid = `mktGrad-${Math.random().toString(36).slice(2, 8)}`;
    return { line, fill, gid, w, h };
  }, [data]);

  if (!svg) return null;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${svg.w} ${svg.h}`} preserveAspectRatio="none" className="flex-shrink-0" style={{ width: 80, height: 32 }}>
      <defs>
        <linearGradient id={svg.gid} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={svg.fill} fill={`url(#${svg.gid})`} />
      <path d={svg.line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QuoteCard({ quote, onClick }: { quote: MarketQuote; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const stateLabel = quote.marketState === "REGULAR" ? "Open"
    : quote.marketState === "PRE" ? "Pre"
    : quote.marketState === "POST" ? "After"
    : quote.marketState === "CLOSED" ? "Closed"
    : quote.marketState;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-[0_0_30px_var(--accent-glow)] w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[var(--foreground)] truncate">{quote.symbol}</span>
            <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${
              quote.category === "crypto"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {quote.category === "crypto" ? "CRYPTO" : "STOCK"}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{quote.name}</div>
        </div>
        <MiniSparkline data={quote.sparkline} positive={positive} />
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-lg font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Open</span>
          <span className="text-[var(--text-secondary)]">{formatPrice(quote.open)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Prev</span>
          <span className="text-[var(--text-secondary)]">{formatPrice(quote.previousClose)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">High</span>
          <span className="text-green-400">{formatPrice(quote.dayHigh)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Low</span>
          <span className="text-red-400">{formatPrice(quote.dayLow)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Vol</span>
          <span className="text-[var(--text-secondary)]">{formatVolume(quote.volume)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">MCap</span>
          <span className="text-[var(--text-secondary)]">{formatMarketCap(quote.marketCap)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
          quote.marketState === "REGULAR" ? "bg-green-500/10 text-green-400" :
          quote.marketState === "PRE" ? "bg-yellow-500/10 text-yellow-400" :
          quote.marketState === "POST" ? "bg-orange-500/10 text-orange-400" :
          "bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}>
          {stateLabel}
        </span>
        <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
      </div>
    </button>
  );
}

function MoverRow({ quote, rank }: { quote: MarketQuote; rank: number }) {
  const positive = quote.changePercent >= 0;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
      <span className="text-[10px] font-bold text-[var(--text-muted)] w-4 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--foreground)] truncate">{quote.symbol}</span>
          <span className={`text-[7px] px-1 py-0.5 rounded font-medium ${
            quote.category === "crypto" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
          }`}>
            {quote.category === "crypto" ? "C" : "S"}
          </span>
        </div>
        <div className="text-[9px] text-[var(--text-muted)] truncate">{quote.name}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</div>
        <div className={`flex items-center gap-0.5 justify-end text-[10px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function DetailModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/market?action=quote&symbol=${symbol}`)
      .then((r) => r.json())
      .then((data) => { if (active && data.quote) setQuote(data.quote); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [symbol]);

  useEffect(() => {
    if (!quote) return;
    const interval = setInterval(() => {
      fetch(`/api/market?action=quote&symbol=${symbol}`)
        .then((r) => r.json())
        .then((data) => { if (data.quote) setQuote(data.quote); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [symbol, quote]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)]">
          <X size={18} />
        </button>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          </div>
        )}

        {quote && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--foreground)]">{quote.symbol}</h2>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  quote.category === "crypto"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {quote.category === "crypto" ? "CRYPTO" : "STOCK"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
              </div>
              <div className="text-sm text-[var(--text-muted)]">{quote.name}</div>
              {quote.exchange && <div className="text-[10px] text-[var(--text-muted)]">{quote.exchange}</div>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
              <div className={`flex items-center gap-1 text-lg font-semibold ${quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {quote.changePercent >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            {quote.sparkline && quote.sparkline.length > 1 && (
              <div className="rounded-xl bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)]">
                <MiniSparkline data={quote.sparkline} positive={quote.changePercent >= 0} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Previous Close", value: formatPrice(quote.previousClose), color: "" },
                { label: "Open", value: formatPrice(quote.open), color: "" },
                { label: "Day High", value: formatPrice(quote.dayHigh), color: "text-green-400" },
                { label: "Day Low", value: formatPrice(quote.dayLow), color: "text-red-400" },
                { label: "Volume", value: formatVolume(quote.volume), color: "" },
                { label: "Avg Volume", value: quote.avgVolume ? formatVolume(quote.avgVolume) : "—", color: "" },
                { label: "Market Cap", value: formatMarketCap(quote.marketCap), color: "" },
                { label: "P/E Ratio", value: quote.pe ? quote.pe.toFixed(2) : "—", color: "" },
                { label: "52W High", value: formatPrice(quote.week52High), color: "text-green-400" },
                { label: "52W Low", value: formatPrice(quote.week52Low), color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)]">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.color || "text-[var(--foreground)]"}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                <Clock size={10} />
                <span>Last update: {new Date(quote.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
              <a
                href={`https://financialmodelingprep.com/asset/${quote.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
              >
                FMP <ArrowUpRight size={9} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketPage() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [gainers, setGainers] = useState<MarketQuote[]>([]);
  const [losers, setLosers] = useState<MarketQuote[]>([]);
  const [movers, setMovers] = useState<MarketQuote[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<"all" | "stock" | "crypto">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"watchlist" | "gainers" | "losers" | "movers">("watchlist");
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`/api/market?action=quotes&category=${filter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.quotes) setQuotes(data.quotes);
      if (data.summary) setSummary(data.summary);
    } catch {}
  }, [filter]);

  const fetchMovers = useCallback(async () => {
    try {
      const [glRes, mvRes] = await Promise.allSettled([
        fetch("/api/market?action=gainers-losers"),
        fetch("/api/market?action=movers"),
      ]);
      if (glRes.status === "fulfilled") {
        const data = await glRes.value.json();
        if (data.gainers) setGainers(data.gainers);
        if (data.losers) setLosers(data.losers);
      }
      if (mvRes.status === "fulfilled") {
        const data = await mvRes.value.json();
        if (data.movers) setMovers(data.movers);
      }
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchWatchlist(), fetchMovers()]);
  }, [fetchWatchlist, fetchMovers]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAll();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAll]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/market?action=search&query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearch(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const selectSearchResult = (result: SearchResult) => {
    setDetailSymbol(result.symbol);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (filter === "stock") return q.category === "stock";
      if (filter === "crypto") return q.category === "crypto";
      return true;
    });
  }, [quotes, filter]);

  const tabs = [
    { id: "watchlist" as const, label: "Watchlist", icon: Activity, count: filteredQuotes.length },
    { id: "gainers" as const, label: "Gainers", icon: TrendingUp, count: gainers.length, color: "text-green-400" },
    { id: "losers" as const, label: "Losers", icon: TrendingDown, count: losers.length, color: "text-red-400" },
    { id: "movers" as const, label: "Top Movers", icon: Flame, count: movers.length, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Market</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Live stock & crypto data · Updates every 10s</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <Wifi size={12} className={autoRefresh ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
            <span>{autoRefresh ? "Live" : "Paused"}</span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              autoRefresh ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </button>
          <button
            onClick={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }}
            disabled={refreshing}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative max-w-xl">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSearch(true)}
          placeholder="Search any stock or crypto symbol..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 focus:shadow-[0_0_20px_var(--accent-glow)] transition-all"
        />
        {searching && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--accent)]" />
        )}

        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.symbol}
                onClick={() => selectSearchResult(result)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-[var(--accent)]">{result.symbol.slice(0, 3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)]">{result.symbol}</span>
                    <span className={`text-[7px] px-1 py-0.5 rounded font-medium ${
                      isCryptoSymbol(result.symbol) ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {isCryptoSymbol(result.symbol) ? "CRYPTO" : "STOCK"}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{result.name}</div>
                </div>
                <ArrowUpRight size={12} className="text-[var(--text-muted)] flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {showSearch && searchQuery && !searching && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-4 text-center">
            <span className="text-xs text-[var(--text-muted)]">No results found</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <BarChart3 size={12} className="text-[var(--accent)]" />
              <span className="text-[10px] uppercase tracking-wider">Assets</span>
            </div>
            <div className="text-xl font-bold gradient-text">{summary.totalAssets}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-[10px] uppercase tracking-wider">Gainers</span>
            </div>
            <div className="text-xl font-bold text-green-400">{summary.gainers}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <TrendingDown size={12} className="text-red-400" />
              <span className="text-[10px] uppercase tracking-wider">Losers</span>
            </div>
            <div className="text-xl font-bold text-red-400">{summary.losers}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <Zap size={12} className="text-[var(--accent)]" />
              <span className="text-[10px] uppercase tracking-wider">Top Mover</span>
            </div>
            <div className="text-sm font-bold text-[var(--foreground)]">{summary.topGainer?.symbol || "—"}</div>
            <div className="text-[10px] text-green-400">{summary.topGainer ? `+${summary.topGainer.changePercent.toFixed(2)}%` : ""}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
          {(["all", "stock", "crypto"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-[var(--accent)] text-black shadow-[0_0_12px_var(--accent-glow)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon size={12} className={tab.color || ""} />
            {tab.label}
            <span className="text-[9px] px-1 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      )}

      {/* Watchlist Grid */}
      {!loading && activeTab === "watchlist" && (
        <>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-16">
              <Activity size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No assets found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotes.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} onClick={() => setDetailSymbol(quote.symbol)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Gainers */}
      {!loading && activeTab === "gainers" && (
        <div className="space-y-1">
          {gainers.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No gainers data available.</div>
            </div>
          ) : (
            gainers.map((q, i) => (
              <div key={q.symbol} onClick={() => setDetailSymbol(q.symbol)} className="cursor-pointer">
                <MoverRow quote={q} rank={i + 1} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Losers */}
      {!loading && activeTab === "losers" && (
        <div className="space-y-1">
          {losers.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No losers data available.</div>
            </div>
          ) : (
            losers.map((q, i) => (
              <div key={q.symbol} onClick={() => setDetailSymbol(q.symbol)} className="cursor-pointer">
                <MoverRow quote={q} rank={i + 1} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Top Movers */}
      {!loading && activeTab === "movers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {movers.length === 0 ? (
            <div className="text-center py-16 col-span-full">
              <Flame size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No movers data available.</div>
            </div>
          ) : (
            movers.map((quote) => (
              <QuoteCard key={quote.symbol} quote={quote} onClick={() => setDetailSymbol(quote.symbol)} />
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-[var(--text-muted)] py-4 border-t border-[var(--border-subtle)]">
        <p>Live data from Financial Modeling Prep · Prices may be delayed · Updates every 10s</p>
        <p className="mt-1">Works for both stocks and crypto · Search any symbol worldwide</p>
      </div>

      {/* Detail Modal */}
      {detailSymbol && (
        <DetailModal symbol={detailSymbol} onClose={() => setDetailSymbol(null)} />
      )}
    </div>
  );
}

function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  if (upper.endsWith("USD") && !upper.includes(".")) return true;
  if (upper.endsWith("-USD")) return true;
  const cryptos = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC", "SHIB", "LTC", "ATOM", "UNI", "FIL", "APT", "ARB", "OP", "NEAR", "SUI", "PEPE", "WIF", "BONK", "FLOKI", "HBAR", "VET", "ALGO"];
  return cryptos.includes(upper);
}
