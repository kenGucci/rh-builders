"use client";

import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import builders from "@/lib/builders.json";
import AddressAvatar from "@/components/AddressAvatar";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpRight, Rocket, TrendingUp, Activity, ArrowUpDown, Clock,
  Zap, RefreshCw, ExternalLink, DollarSign, Users, Flame, Layers,
  Shield, Star, BarChart3, Code, ChevronRight, TrendingDown,
} from "lucide-react";

interface BuilderStat {
  address: string;
  balance: string;
  balanceFormatted: string;
  balanceUsd: string;
  txCount: number;
  tokenCount: number;
  isContract: boolean;
  lastTxTimestamp: string | null;
  ethPrice: number;
  name: string | null;
  isVerified: boolean;
  tokenSymbol: string | null;
}

interface DexTx {
  hash: string;
  from: string;
  fromName: string | null;
  to: string | null;
  toName: string | null;
  toIsContract: boolean;
  value: string;
  timestamp: string;
  block_number: number;
  method: string | null;
  status: string | null;
  fee: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenAddress: string | null;
  tokenIcon: string | null;
  tokenAmount: string | null;
  type: "swap" | "transfer" | "contract" | "coin";
}

interface TopToken {
  address_hash: string;
  symbol: string;
  name: string;
  icon_url: string | null;
  holders_count: number;
}

type SortKey = "name" | "balance" | "txCount" | "lastActive";

interface ChainStats {
  totalAddresses: number;
  totalTransactions: number;
  totalTokens: number;
  txsToday: number;
}

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
  priceChange24h: number;
  priceChange1h: number;
  priceChange6h: number;
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

function timeAgo(ts: string | null) {
  if (!ts) return "never";
  const t = ts.includes("T") ? new Date(ts).getTime() / 1000 : parseInt(ts);
  const diff = Date.now() / 1000 - t;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatValue(val: string) {
  try {
    const eth = Number(BigInt(val)) / 1e18;
    if (eth >= 1e6) return `${(eth / 1e6).toFixed(2)}M`;
    if (eth >= 1e3) return `${(eth / 1e3).toFixed(2)}K`;
    if (eth === 0) return "0";
    return eth.toFixed(4);
  } catch { return "0"; }
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n === 0) return "0";
  return n.toFixed(2);
}

function formatDeployed(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function DexTxIcon({ type }: { type: DexTx["type"] }) {
  if (type === "swap") return <ArrowUpRight size={12} className="text-[var(--accent)]" />;
  if (type === "transfer") return <DollarSign size={12} className="text-blue-400" />;
  if (type === "contract") return <Code size={12} className="text-purple-400" />;
  return <Zap size={12} className="text-orange-400" />;
}

function DexTxLabel({ type }: { type: DexTx["type"] }) {
  if (type === "swap") return <span className="text-[var(--accent)] font-medium">Swap</span>;
  if (type === "transfer") return <span className="text-blue-400 font-medium">Transfer</span>;
  if (type === "contract") return <span className="text-purple-400 font-medium">Contract</span>;
  return <span className="text-orange-400 font-medium">Coin</span>;
}

export default function BuildersPage() {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("txCount");
  const [statsMap, setStatsMap] = useState<Record<string, BuilderStat>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [dexTxs, setDexTxs] = useState<DexTx[]>([]);
  const [topTokens, setTopTokens] = useState<TopToken[]>([]);
  const [liveBlock, setLiveBlock] = useState(0);
  const [liveLoading, setLiveLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);
  const [dexTokens, setDexTokens] = useState<DexToken[]>([]);
  const [dexLoading, setDexLoading] = useState(true);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const b of builders.builders) {
      for (const tag of b.tags || []) tags.add(tag);
    }
    return Array.from(tags).sort();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, chainRes] = await Promise.all([
        fetch("/api/builders-stats"),
        fetch("/api/chain-stats"),
      ]);
      const statsData = await statsRes.json();
      setStatsMap(statsData.stats || {});
      const chainData = await chainRes.json();
      setChainStats(chainData);
      setLastRefresh(new Date());
    } catch {} finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/live-activity");
      const data = await res.json();
      setDexTxs(data.transactions || []);
      setTopTokens(data.topTokens || []);
      setLiveBlock(data.block_number || 0);
    } catch {} finally {
      setLiveLoading(false);
    }
  }, []);

  const fetchDex = useCallback(async () => {
    try {
      const res = await fetch("/api/dex-screener");
      const data = await res.json();
      setDexTokens(data.tokens || []);
    } catch {} finally {
      setDexLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLive();
    fetchDex();
    const statsInterval = setInterval(fetchStats, 30000);
    const liveInterval = setInterval(fetchLive, 15000);
    const dexInterval = setInterval(fetchDex, 60000);
    return () => { clearInterval(statsInterval); clearInterval(liveInterval); clearInterval(dexInterval); };
  }, [fetchStats, fetchLive, fetchDex]);

  const enrichedBuilders = useMemo(() => {
    return builders.builders.map((b) => {
      const stat = statsMap[b.address.toLowerCase()];
      return { ...b, stat };
    });
  }, [statsMap]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    let list = q
      ? enrichedBuilders.filter((b) => {
          const fields = [b.name, b.twitter, b.ens, ...(b.tags || [])].filter(Boolean).map((f) => f!.toLowerCase());
          return fields.some((f) => f.includes(q));
        })
      : enrichedBuilders;

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "balance":
          return Number(b.stat?.balance || 0) - Number(a.stat?.balance || 0);
        case "txCount":
          return (b.stat?.txCount || 0) - (a.stat?.txCount || 0);
        case "lastActive":
          const aTs = a.stat?.lastTxTimestamp ? new Date(a.stat.lastTxTimestamp).getTime() : 0;
          const bTs = b.stat?.lastTxTimestamp ? new Date(b.stat.lastTxTimestamp).getTime() : 0;
          return bTs - aTs;
        default:
          return 0;
      }
    });
  }, [enrichedBuilders, filter, sortBy]);

  const totalTxs = Object.values(statsMap).reduce((s, b) => s + (b.txCount || 0), 0);
  const totalTokens = Object.values(statsMap).reduce((s, b) => s + (b.tokenCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <Rocket size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Builders[Dev]</h1>
            <p className="text-sm text-[var(--text-muted)]">
              The most active developers on Robinhood Chain right now. {builders.builders.length} launchpads deploying tokens, bonding curves, and fair-launch mechanisms on Chain ID 4663. All data sourced live from Blockscout.
            </p>
          </div>
        </div>

        {/* Aggregate stats */}
        {!statsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AggregateCard label="Total Addresses" value={chainStats?.totalAddresses ? formatDeployed(chainStats.totalAddresses) : "—"} icon={<Users size={14} />} />
            <AggregateCard label="Total Transactions" value={chainStats?.totalTransactions ? formatDeployed(chainStats.totalTransactions) : "—"} icon={<TrendingUp size={14} />} />
            <AggregateCard label="ERC-20 Tokens" value={chainStats?.totalTokens ? formatDeployed(chainStats.totalTokens) : "—"} icon={<Activity size={14} />} />
            <AggregateCard label="Network Block" value={`#${liveBlock.toLocaleString()}`} icon={<Clock size={14} />} live />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar compact />
          </div>
          <button
            onClick={() => { setStatsLoading(true); fetchStats(); fetchLive(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
          >
            <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Trending Launchpads */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-orange-400" />
          <h2 className="text-sm font-semibold">Trending Launchpads</h2>
          <span className="text-[10px] text-[var(--text-muted)]">— live on-chain data</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {enrichedBuilders.slice(0, 4).map((b) => (
            <Link
              key={b.address}
              href={`/builder/${b.address.toLowerCase()}`}
              className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 hover:shadow-[0_4px_20px_rgba(0,200,5,0.05)] transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <AddressAvatar address={b.address} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate group-hover:text-[var(--accent)] transition-colors">{b.name}</div>
                  {b.twitter && (
                    <div className="text-[9px] text-[var(--text-muted)] truncate">@{b.twitter}</div>
                  )}
                </div>
                <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
              </div>
              {b.stat && (
                <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-0.5"><Activity size={8} className="text-[var(--accent)]" />{b.stat.txCount.toLocaleString()} txs</span>
                  <span className="flex items-center gap-0.5"><Zap size={8} className="text-yellow-400" />{b.stat.tokenCount} tokens</span>
                  {Number(b.stat.balance) > 0 && (
                    <span className="flex items-center gap-0.5"><DollarSign size={8} className="text-blue-400" />{b.stat.balanceFormatted} ETH</span>
                  )}
                </div>
              )}
              {b.stat?.lastTxTimestamp && (
                <div className="text-[8px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                  <Clock size={7} />Last active: {timeAgo(b.stat.lastTxTimestamp)}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Deployed Tech on Robinhood Chain */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-purple-400" />
          <h2 className="text-sm font-semibold">Deployed Tech</h2>
          <span className="text-[10px] text-[var(--text-muted)]">— what&apos;s live on Robinhood Chain</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <TechCard icon={<Rocket size={16} />} title="Token Launchpads" count={`${builders.builders.filter(b => b.category === "Launchpad").length} active`} desc="Bonding curves, fair-launch, instant deploy" color="accent" />
          <TechCard icon={<Shield size={16} />} title="Anti-Rug Mechanisms" count="Built-in" desc="LP locking, renounced ownership, audits" color="green" />
          <TechCard icon={<BarChart3 size={16} />} title="On-Chain Analytics" count="Live" desc="Holder distribution, tx tracking, rugs" color="blue" />
          <TechCard icon={<Code size={16} />} title="ERC-20 Standards" count={`${totalTokens} deployed`} desc="Standard, proxy, gasless, meta-tx" color="purple" />
        </div>
      </section>

      {/* Sort + Tag filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap" role="toolbar" aria-label="Sort developers">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mr-1">Sort:</span>
          {(["txCount", "balance", "lastActive", "name"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 ${
                sortBy === key ? "bg-[var(--accent)] text-black font-medium" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
              }`}
            >
              <ArrowUpDown size={10} />
              {key === "txCount" && "Most Active"}
              {key === "balance" && "Richest"}
              {key === "lastActive" && "Recently Active"}
              {key === "name" && "A-Z"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter developers by tag">
          <button
            onClick={() => setFilter("")}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
              filter === "" ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
            }`}
          >
            All ({builders.builders.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                filter.toLowerCase() === tag.toLowerCase() ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Builder cards — live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Developer profiles">
        {filtered.map((b, i) => (
          <Link
            key={b.address}
            href={`/builder/${b.address.toLowerCase()}`}
            className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 transition-all duration-200 hover:shadow-[0_0_20px_var(--accent-glow)] fade-in"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            role="listitem"
            aria-label={`${b.name}${b.description ? ` — ${b.description.slice(0, 100)}` : ''}. ${b.stat ? `${b.stat.txCount} transactions, ${b.stat.balanceFormatted} ETH` : 'Loading stats...'}`}
          >
            <div className="flex items-start gap-3">
              <AddressAvatar address={b.address} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{b.name}</span>
                  {b.stat?.tokenSymbol && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex-shrink-0 font-mono">${b.stat.tokenSymbol}</span>
                  )}
                  {b.stat?.isVerified && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 flex-shrink-0">✓</span>
                  )}
                </div>
                {b.twitter && (
                  <a
                    href={`https://x.com/${b.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[#1DA1F2] transition-colors flex items-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    @{b.twitter}
                  </a>
                )}

                {/* Live stats row */}
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  {b.stat ? (
                    <>
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <TrendingUp size={10} className="text-[var(--accent)]" />
                        {b.stat.balanceFormatted} ETH
                      </span>
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <Activity size={10} className="text-[var(--accent)]" />
                        {b.stat.txCount.toLocaleString()} txs
                      </span>
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <Zap size={10} className="text-[var(--accent)]" />
                        {b.stat.tokenCount} tokens
                      </span>
                    </>
                  ) : statsLoading ? (
                    <>
                      <span className="h-3 w-12 rounded animate-shimmer inline-block" style={{ background: "var(--bg-card-hover)" }} />
                      <span className="h-3 w-10 rounded animate-shimmer inline-block" style={{ background: "var(--bg-card-hover)" }} />
                    </>
                  ) : null}
                </div>

                {b.stat && (b.stat.txCount > 0 || Number(b.stat.balance) > 0) && (
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                    <span className="text-purple-400 flex items-center gap-1">
                      <Activity size={9} />
                      {b.stat.txCount.toLocaleString()} txs
                    </span>
                    {b.stat.tokenCount > 0 && (
                      <span className="text-green-400 flex items-center gap-1">
                        <Rocket size={9} />
                        {b.stat.tokenCount} tokens
                      </span>
                    )}
                    {Number(b.stat.balance) > 0 && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <DollarSign size={9} />
                        {b.stat.balanceFormatted} ETH
                      </span>
                    )}
                  </div>
                )}

                {b.stat?.lastTxTimestamp && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                    <Clock size={9} />
                    Last active: {timeAgo(b.stat.lastTxTimestamp)}
                  </div>
                )}

                {b.tags && b.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                        {tag}
                      </span>
                    ))}
                    {b.tags.length > 4 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)]">
                        +{b.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {b.description && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                {b.stat?.balanceUsd && b.stat.balanceUsd !== "$0" && (
                  <span className="text-[10px] text-[var(--text-muted)]">{b.stat.balanceUsd}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">
          No developers found matching &ldquo;{filter}&rdquo;
        </div>
      )}

      {/* DexScreener: Robinhood Chain Tokens */}
      {dexTokens.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-[var(--accent)]" />
            <h2 className="text-sm font-semibold">Robinhood Chain Tokens</h2>
            <span className="text-[10px] text-[var(--text-muted)]">— from DexScreener · sorted by volume</span>
            {dexLoading && <RefreshCw size={10} className="text-[var(--text-muted)] animate-spin" />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {dexTokens.slice(0, 12).map((t) => {
              const isUp = t.priceChange24h >= 0;
              const buyRatio = t.buys24h + t.sells24h > 0
                ? Math.round((t.buys24h / (t.buys24h + t.sells24h)) * 100)
                : 50;
              return (
                <a
                  key={t.address}
                  href={t.url || `https://dexscreener.com/robinhoodchain/${t.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 hover:border-[var(--accent)]/30 transition-all group"
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
                        <div className="text-xs font-semibold truncate max-w-[100px] group-hover:text-[var(--accent)] transition-colors">{t.symbol}</div>
                        <div className="text-[8px] text-[var(--text-muted)] truncate max-w-[100px]">{t.name}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {isUp ? "+" : ""}{t.priceChange24h.toFixed(1)}%
                    </div>
                  </div>

                  <div className="text-sm font-mono font-bold text-[var(--foreground)] mb-1.5">
                    ${Number(t.priceUsd).toFixed(Number(t.priceUsd) < 0.01 ? 8 : Number(t.priceUsd) < 1 ? 6 : 2)}
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
                      <span className="text-[var(--text-muted)]">Buys</span>
                      <span className="font-mono text-green-400">{t.buys24h}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Vol 1h</span>
                      <span className="font-mono">${formatCompact(t.volume1h)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Sells</span>
                      <span className="font-mono text-red-400">{t.sells24h}</span>
                    </div>
                  </div>

                  {/* Buy/Sell ratio bar */}
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
        </section>
      )}

      {/* Live Dex Activity Feed */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 live-blink" />
            <span className="text-sm font-medium">Live Dex Activity Feed</span>
            <span className="text-[10px] text-[var(--text-muted)]">Block #{liveBlock.toLocaleString()}</span>
          </div>
          <button
            onClick={fetchLive}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
          >
            <RefreshCw size={10} className={liveLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {liveLoading && dexTxs.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              </div>
            ))
          ) : dexTxs.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No live DEX activity available
            </div>
          ) : (
            dexTxs.map((tx, i) => {
              const val = formatValue(tx.value);
              return (
                <div
                  key={tx.hash}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <DexTxIcon type={tx.type} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <DexTxLabel type={tx.type} />
                        {tx.tokenSymbol && (
                          <a
                            href={tx.tokenAddress ? `https://dexscreener.com/robinhood/${tx.tokenAddress}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[var(--accent)] hover:underline font-medium"
                          >
                            {tx.tokenSymbol}
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                        <a
                          href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono hover:text-[var(--accent)] transition-colors"
                        >
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(-4)}
                        </a>
                        <span>·</span>
                        <span>{timeAgo(tx.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {tx.tokenAmount && tx.tokenSymbol ? (
                      <div className="text-xs font-mono text-[var(--foreground)]">
                        {Number(tx.tokenAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-[var(--text-muted)]">{tx.tokenSymbol}</span>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-[var(--accent)]">{val} ETH</div>
                    )}
                    <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-1 justify-end">
                      {tx.fromName || <span className="font-mono">{tx.from.slice(0, 6)}...{tx.from.slice(-3)}</span>}
                      <span>→</span>
                      {tx.toName || (tx.to ? <span className="font-mono">{tx.to.slice(0, 6)}...{tx.to.slice(-3)}</span> : "contract")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {lastRefresh && (
        <div className="text-center text-[10px] text-[var(--text-muted)]">
          Stats refresh every 30s · DEX feed every 15s · DexScreener every 60s · Last: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

function AggregateCard({ label, value, icon, live }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className={`bg-[var(--surface)] border rounded-xl p-3 text-center ${live ? "border-green-500/20" : "border-[var(--border)]"}`}>
      <div className="flex items-center justify-center gap-1.5 text-[var(--text-muted)] mb-1">
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
        {live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />}
      </div>
      <div className="text-lg font-bold gradient-text">{value}</div>
    </div>
  );
}

function TechCard({ icon, title, count, desc, color }: {
  icon: React.ReactNode;
  title: string;
  count: string;
  desc: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    accent: "text-[var(--accent)] border-[var(--accent)]/20 bg-[var(--accent)]/5",
    green: "text-green-400 border-green-400/20 bg-green-400/5",
    blue: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    purple: "text-purple-400 border-purple-400/20 bg-purple-400/5",
  };
  const c = colorMap[color] || colorMap.accent;

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/20 transition-all`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c}`}>
        {icon}
      </div>
      <div className="text-xs font-semibold">{title}</div>
      <div className="text-[10px] font-medium text-[var(--foreground)] mt-0.5">{count}</div>
      <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{desc}</div>
    </div>
  );
}
