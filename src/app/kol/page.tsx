"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, TrendingUp, Activity, Search, ArrowUpRight, ExternalLink,
  Zap, Star, Clock, RefreshCw, Shield, ChevronDown, ChevronUp,
  BarChart3, DollarSign, Globe, Wallet, TrendingDown, X, Flame, Trophy,
  ArrowUp, ArrowDown, Minus, Coins,
} from "lucide-react";
import AddressAvatar from "@/components/AddressAvatar";

interface Coin {
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

interface BuilderProfile {
  address: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  description: string;
  tags: string[];
  followers: number | null;
  totalTxs: number;
  tokenCount: number;
  pnlUsd: string;
  pnlPercent: number;
  portfolioValue: string;
  balanceEth: string;
  winRate: number | null;
  networks: string[];
}

type TimePeriod = "m5" | "h1" | "h6" | "h24";

function timeAgo(ts: number) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - ts / 1000;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatUsd(n: number | string): string {
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(val) || val === 0) return "$0";
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function formatPrice(n: string): string {
  const val = parseFloat(n);
  if (isNaN(val) || val === 0) return "$0";
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val >= 0.01) return `$${val.toFixed(4)}`;
  if (val >= 0.0001) return `$${val.toFixed(6)}`;
  return `$${val.toFixed(8)}`;
}

function formatFollowers(n: number | null): string {
  if (n === null) return "";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function PriceChangeBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
      <Minus size={8} /> 0%
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${value > 0 ? "text-green-400" : "text-red-400"}`}>
      {value > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function VolumeBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1 rounded-full bg-[var(--border)] overflow-hidden">
      <div className="h-full rounded-full bg-[var(--accent)]/40 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function CoinCard({ coin, rank, maxVolume }: { coin: Coin; rank: number; maxVolume: number }) {
  const [expanded, setExpanded] = useState(false);
  const totalBuys = coin.buys24h + coin.sells24h;
  const buyRatio = totalBuys > 0 ? (coin.buys24h / totalBuys) * 100 : 50;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/20 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0">
            {rank}
          </div>

          {coin.imageUrl ? (
            <img src={coin.imageUrl} alt={coin.symbol} className="w-10 h-10 rounded-full border border-[var(--border)] object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--accent)]">{coin.symbol.slice(0, 2)}</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13px] text-[var(--foreground)]">{coin.symbol}</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate">{coin.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
              <span>{formatPrice(coin.priceUsd)}</span>
              <PriceChangeBadge value={coin.priceChange24h} />
              <span>MC {formatUsd(coin.marketCap)}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0 space-y-1">
            <div className="text-[11px] font-medium text-[var(--foreground)]">{formatUsd(coin.volume24h)}</div>
            <div className="text-[9px] text-[var(--text-muted)]">vol 24h</div>
          </div>

          <ChevronDown
            size={14}
            className={`text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[9px] text-[var(--text-muted)]">5m</div>
              <div className="text-[11px] font-bold text-[var(--foreground)]">{formatUsd(coin.volumeM5)}</div>
              <PriceChangeBadge value={coin.priceChangeM5} />
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[9px] text-[var(--text-muted)]">1h</div>
              <div className="text-[11px] font-bold text-[var(--foreground)]">{formatUsd(coin.volume1h)}</div>
              <PriceChangeBadge value={coin.priceChange1h} />
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[9px] text-[var(--text-muted)]">6h</div>
              <div className="text-[11px] font-bold text-[var(--foreground)]">{formatUsd(coin.volume6h)}</div>
              <PriceChangeBadge value={coin.priceChange6h} />
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
              <div className="text-[9px] text-[var(--text-muted)]">24h</div>
              <div className="text-[11px] font-bold text-[var(--foreground)]">{formatUsd(coin.volume24h)}</div>
              <PriceChangeBadge value={coin.priceChange24h} />
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[var(--text-muted)]">Buys: <span className="text-green-400 font-medium">{coin.buys24h}</span></span>
            <span className="text-[var(--text-muted)]">Sells: <span className="text-red-400 font-medium">{coin.sells24h}</span></span>
            <span className="text-[var(--text-muted)]">Liq: <span className="text-[var(--foreground)] font-medium">{formatUsd(coin.liquidityUsd)}</span></span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
              <span>Buy/Sell ratio</span>
              <span>{buyRatio.toFixed(0)}% buys</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden flex">
              <div className="h-full bg-green-400/60 transition-all" style={{ width: `${buyRatio}%` }} />
              <div className="h-full bg-red-400/60 transition-all" style={{ width: `${100 - buyRatio}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {coin.url && (
              <a href={coin.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline">
                DexScreener <ExternalLink size={8} />
              </a>
            )}
            <a href={`https://robinhoodchain.blockscout.com/token/${coin.address}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              Blockscout <ExternalLink size={8} />
            </a>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/5 text-[var(--accent)]/70 border border-[var(--accent)]/10">
              {coin.dex}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function BuilderCard({ builder }: { builder: BuilderProfile }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)]/20 transition-all">
      <div className="flex items-center gap-3">
        <AddressAvatar address={builder.address} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-[var(--foreground)]">{builder.name}</span>
            {builder.handle && (
              <a href={`https://x.com/${builder.handle}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[var(--accent)]/70 hover:text-[var(--accent)] flex items-center gap-0.5">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                @{builder.handle}
              </a>
            )}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{builder.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)]">Txs</div>
          <div className="text-[11px] font-bold text-[var(--foreground)]">{builder.totalTxs.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)]">Tokens</div>
          <div className="text-[11px] font-bold text-[var(--foreground)]">{builder.tokenCount}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)]">PnL</div>
          <div className={`text-[11px] font-bold ${parseFloat(builder.pnlUsd) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {parseFloat(builder.pnlUsd) >= 0 ? "+" : ""}{formatUsd(builder.pnlUsd)}
          </div>
        </div>
      </div>

      {builder.followers !== null && builder.followers > 0 && (
        <div className="mt-2 text-[9px] text-[var(--text-muted)] flex items-center gap-1">
          <Users size={8} /> {formatFollowers(builder.followers)} followers
        </div>
      )}
    </div>
  );
}

export default function TrendingPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>("h24");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrending = useCallback(async (p: TimePeriod, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [coinsRes, buildersRes] = await Promise.all([
        fetch(`/api/trending?period=${p}&limit=30`),
        fetch(`/api/kol?category=all`),
      ]);

      if (coinsRes.ok) {
        const coinsData = await coinsRes.json();
        setCoins(coinsData.coins || []);
      }

      if (buildersRes.ok) {
        const buildersData = await buildersRes.json();
        setBuilders(buildersData.leaderboard?.slice(0, 12) || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch trending data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending(period);

    intervalRef.current = setInterval(() => {
      fetchTrending(period, true);
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [period, fetchTrending]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrending(period);
    setRefreshing(false);
  };

  const handlePeriodChange = (p: TimePeriod) => {
    setPeriod(p);
  };

  const maxVolume = coins.length > 0 ? Math.max(...coins.map((c) => {
    if (period === "m5") return c.volumeM5;
    if (period === "h1") return c.volume1h;
    if (period === "h6") return c.volume6h;
    return c.volume24h;
  })) : 1;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Trending Coins</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Live trending tokens on Robinhood Chain — sorted by volume
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[10px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] live-blink" />
              <span className="text-[var(--text-muted)]">Live</span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {([
          { key: "m5", label: "5m" },
          { key: "h1", label: "1h" },
          { key: "h6", label: "6h" },
          { key: "h24", label: "24h" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePeriodChange(key)}
            className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-all ${
              period === key
                ? "bg-[var(--accent)] text-black"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trending Coins */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      ) : coins.length === 0 ? (
        <div className="text-center py-16">
          <Coins size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
          <div className="text-sm text-[var(--text-muted)]">No trending coins found for this period.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {coins.map((coin, i) => (
            <CoinCard key={coin.pairAddress || coin.address} coin={coin} rank={i + 1} maxVolume={maxVolume} />
          ))}
        </div>
      )}

      {/* Builders Section */}
      {builders.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="text-sm font-semibold">Top Builders</h2>
            <span className="text-[10px] text-[var(--text-muted)]">— ranked by on-chain activity</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {builders.map((builder) => (
              <BuilderCard key={builder.address} builder={builder} />
            ))}
          </div>
        </section>
      )}

      <div className="text-center text-[10px] text-[var(--text-muted)] py-4">
        Data from DexScreener + Blockscout · Auto-refreshes every 60s
      </div>
    </div>
  );
}
