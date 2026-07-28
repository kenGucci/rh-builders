"use client";

import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import AddressAvatar from "@/components/AddressAvatar";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpRight, Activity, ArrowUpDown, Clock,
  RefreshCw, DollarSign, Flame, Layers,
  Shield, BarChart3, Code, Rocket,
  TrendingUp, Users,
} from "lucide-react";

interface Builder {
  address: string;
  name: string;
  twitter: string;
  ens: string;
  description: string;
  category: string;
  website: string;
  github: string;
  logo: string;
  foundingDate: string;
  team: string[];
  tags: string[];
}

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

type SortKey = "name" | "balance" | "txCount" | "lastActive";

interface ChainStats {
  totalAddresses: number;
  totalTransactions: number;
  totalTokens: number;
  txsToday: number;
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

function formatDeployed(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function BuilderListClient({ builders }: { builders: Builder[] }) {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("txCount");
  const [statsMap, setStatsMap] = useState<Record<string, BuilderStat>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [liveBlock, setLiveBlock] = useState(0);
  const [liveLoading, setLiveLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);
  const [trendingTokens, setTrendingTokens] = useState<Record<string, unknown>[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const b of builders) {
      for (const tag of b.tags || []) tags.add(tag);
    }
    return Array.from(tags).sort();
  }, [builders]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, chainRes] = await Promise.all([
        fetch("/api/builders-stats"),
        fetch("/api/chain-stats"),
      ]);
      const statsData = await statsRes.json();
      setStatsMap(statsData.stats || {});
      if (chainRes.ok) {
        const chainData = await chainRes.json();
        if (!chainData.error) setChainStats(chainData);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[BuilderList] Stats fetch failed:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/live-activity");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiveBlock(data.block_number || 0);
      if (Array.isArray(data.trending)) setTrendingTokens(data.trending);
    } catch (err) {
      console.error("[BuilderList] Live activity fetch failed:", err);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLive();
    const statsInterval = setInterval(fetchStats, 30000);
    const liveInterval = setInterval(fetchLive, 15000);
    return () => { clearInterval(statsInterval); clearInterval(liveInterval); };
  }, [fetchStats, fetchLive]);

  const enrichedBuilders = useMemo(() => {
    return builders.map((b) => {
      const stat = statsMap[b.address.toLowerCase()];
      return { ...b, stat };
    });
  }, [builders, statsMap]);

  const activeLaunchpadCount = useMemo(
    () => enrichedBuilders.filter((b) => b.category === "Launchpad" && b.stat && b.stat.txCount > 0).length,
    [enrichedBuilders]
  );
  const antiRugCount = useMemo(
    () => enrichedBuilders.filter((b) => (b.tags || []).includes("anti-rug")).length,
    [enrichedBuilders]
  );
  const analyticsCount = useMemo(
    () => enrichedBuilders.filter((b) => (b.tags || []).includes("analytics")).length,
    [enrichedBuilders]
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of builders) {
      for (const tag of b.tags || []) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [builders]);

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
        case "lastActive": {
          const aTs = a.stat?.lastTxTimestamp ? new Date(a.stat.lastTxTimestamp).getTime() : 0;
          const bTs = b.stat?.lastTxTimestamp ? new Date(b.stat.lastTxTimestamp).getTime() : 0;
          return bTs - aTs;
        }
        default:
          return 0;
      }
    });
  }, [enrichedBuilders, filter, sortBy]);

  const totalTokens = Object.values(statsMap).reduce((s, b) => s + (b.tokenCount || 0), 0);

  return (
    <div className="space-y-6 fade-in">
      {chainStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AggregateCard label="Total Addresses" value={formatDeployed(chainStats.totalAddresses)} icon={<Users size={14} />} />
          <AggregateCard label="Total Transactions" value={formatDeployed(chainStats.totalTransactions)} icon={<TrendingUp size={14} />} />
          <AggregateCard label="ERC-20 Tokens" value={formatDeployed(chainStats.totalTokens)} icon={<Activity size={14} />} />
          <AggregateCard label="Network Block" value={liveBlock > 0 ? `#${liveBlock.toLocaleString()}` : "—"} icon={<Clock size={14} />} live />
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

      {/* Top Trending Coins */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} className="text-orange-400" />
          <h2 className="text-sm font-semibold">Top Trending Coins</h2>
          <span className="text-[10px] text-[var(--text-muted)]">— by 24h volume on Robinhood Chain</span>
          {!liveLoading && trendingTokens.length > 0 && (
            <span className="ml-auto text-[9px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
              Live
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {liveLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
            ))
          ) : trendingTokens.length > 0 ? (
            trendingTokens.slice(0, 8).map((token, i) => {
              const name = (token.name as string) || "Unknown";
              const symbol = (token.symbol as string) || "???";
              const priceUsd = parseFloat(token.priceUsd as string || "0");
              const volume24h = (token.volume24h as number) || 0;
              const marketCap = (token.marketCap as number) || 0;
              const priceChange24h = (token.priceChange24h as number) || 0;
              const liquidityUsd = (token.liquidityUsd as number) || 0;
              const buys24h = (token.buys24h as number) || 0;
              const sells24h = (token.sells24h as number) || 0;
              const address = (token.address as string) || "";
              const dexUrl = (token.url as string) || "";
              const imageUrl = (token.imageUrl as string) || null;
              const isPositive = priceChange24h >= 0;
              const buyRatio = buys24h + sells24h > 0 ? (buys24h / (buys24h + sells24h)) * 100 : 50;
              const colors = ["#00c805", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];
              const bgColor = colors[i % colors.length];

              return (
                <a
                  key={`${address}-${i}`}
                  href={dexUrl || `https://dexscreener.com/robinhood/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 hover:shadow-[0_4px_20px_rgba(0,200,5,0.05)] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={name}
                          className="w-9 h-9 rounded-full border border-[var(--border)] object-cover bg-[var(--surface)]"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                        />
                      ) : null}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${imageUrl ? "hidden" : ""}`} style={{ backgroundColor: bgColor }}>
                        {symbol.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-[var(--accent)] transition-colors">{name}</div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">${symbol}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {isPositive ? "+" : ""}{priceChange24h.toFixed(1)}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Price</span>
                      <span className="font-medium">
                        {priceUsd < 0.0001 ? `$${priceUsd.toExponential(2)}` : priceUsd < 1 ? `$${priceUsd.toFixed(6)}` : `$${priceUsd.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Volume 24h</span>
                      <span className="font-medium text-blue-400">${volume24h >= 1e6 ? `${(volume24h / 1e6).toFixed(2)}M` : volume24h >= 1e3 ? `${(volume24h / 1e3).toFixed(1)}K` : volume24h.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Market Cap</span>
                      <span className="font-medium">${marketCap >= 1e6 ? `${(marketCap / 1e6).toFixed(2)}M` : marketCap >= 1e3 ? `${(marketCap / 1e3).toFixed(1)}K` : marketCap.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Liquidity</span>
                      <span className="font-medium text-purple-400">${liquidityUsd >= 1e6 ? `${(liquidityUsd / 1e6).toFixed(2)}M` : liquidityUsd >= 1e3 ? `${(liquidityUsd / 1e3).toFixed(1)}K` : liquidityUsd.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[var(--text-muted)]">Buy/Sell ratio</span>
                      <span className={buyRatio >= 50 ? "text-green-400" : "text-red-400"}>
                        {buys24h.toLocaleString()} / {sells24h.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-[var(--border)] mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${buyRatio}%`, backgroundColor: buyRatio >= 50 ? "#22c55e" : "#ef4444" }} />
                    </div>
                  </div>
                </a>
              );
            })
          ) : (
            <div className="col-span-full text-center py-6 text-[var(--text-muted)] text-xs">No trending tokens found</div>
          )}
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
          <TechCard
            icon={<Rocket size={16} />}
            title="Token Launchpads"
            count={statsLoading ? "..." : `${activeLaunchpadCount} active`}
            desc="Bonding curves, fair-launch, instant deploy"
            color="accent"
          />
          <TechCard
            icon={<Shield size={16} />}
            title="Anti-Rug Mechanisms"
            count={statsLoading ? "..." : `${antiRugCount} verified`}
            desc="LP locking, renounced ownership, audits"
            color="green"
          />
          <TechCard
            icon={<BarChart3 size={16} />}
            title="On-Chain Analytics"
            count={statsLoading ? "..." : `${analyticsCount} tools`}
            desc="Holder distribution, tx tracking, rugs"
            color="blue"
          />
          <TechCard
            icon={<Code size={16} />}
            title="ERC-20 Standards"
            count={statsLoading ? "..." : `${totalTokens} deployed`}
            desc="Standard, proxy, gasless, meta-tx"
            color="purple"
          />
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
            All ({builders.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                filter.toLowerCase() === tag.toLowerCase() ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
              }`}
            >
              {tag} ({tagCounts[tag] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Builder cards — live data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Developer profiles">
        {filtered.map((b, i) => (
          <Link
            key={`${b.address}-${i}`}
            href={`/builder/${b.address.toLowerCase()}`}
            className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 transition-all duration-200 hover:shadow-[0_0_20px_var(--accent-glow)] fade-in"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            role="listitem"
            aria-label={`${b.name}${b.description ? ` — ${b.description.slice(0, 100)}` : ''}. ${b.stat ? `${b.stat.txCount} transactions, ${b.stat.balanceFormatted} ETH` : 'Loading stats...'}`}
          >
            <div className="flex items-start gap-3">
              <AddressAvatar address={b.address} size={44} handle={b.twitter} />
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
                  <span
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(`https://x.com/${b.twitter}`, "_blank", "noopener"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") window.open(`https://x.com/${b.twitter}`, "_blank", "noopener"); }}
                    role="link"
                    tabIndex={0}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[#1DA1F2] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    @{b.twitter}
                  </span>
                )}

                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  {b.stat ? (
                    <>
                      {Number(b.stat.balance) > 0 && (
                        <span className="text-[var(--text-muted)] flex items-center gap-1">
                          <DollarSign size={10} className="text-blue-400" />
                          {b.stat.balanceFormatted} ETH
                        </span>
                      )}
                      {b.stat.txCount > 0 && (
                        <span className="text-[var(--text-muted)] flex items-center gap-1">
                          <Activity size={10} className="text-purple-400" />
                          {b.stat.txCount.toLocaleString()} txs
                        </span>
                      )}
                      {b.stat.tokenCount > 0 && (
                        <span className="text-[var(--text-muted)] flex items-center gap-1">
                          <Rocket size={10} className="text-green-400" />
                          {b.stat.tokenCount} tokens
                        </span>
                      )}
                    </>
                  ) : statsLoading ? (
                    <span className="h-3 w-10 rounded animate-shimmer inline-block" style={{ background: "var(--bg-card-hover)" }} />
                  ) : null}
                </div>

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
