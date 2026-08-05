"use client";

import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import AddressAvatar from "@/components/AddressAvatar";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpRight, Activity, ArrowUpDown, Clock,
  RefreshCw, DollarSign, Rocket,
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

interface DeployedToken {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
}

interface NewBuilderStat {
  balanceEth: string;
  balanceUsd: string;
  txCount: number;
  tokenTransfers: number;
  isContract: boolean;
  isVerified: boolean;
  name: string | null;
  tokenSymbol: string | null;
  ethPrice: number;
  lastTxTimestamp: string | null;
}

interface NewBuilder extends Builder {
  isNew: boolean;
  source: "token" | "x";
  deployedTokens: DeployedToken[];
  stat?: NewBuilderStat;
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);
  const [newBuilders, setNewBuilders] = useState<NewBuilder[]>([]);

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
      const liveRes = await fetch("/api/live-activity");
      if (liveRes.ok) {
        const data = await liveRes.json();
        setLiveBlock(data.block_number || 0);
      }
    } catch {
    }
  }, []);

  const fetchNewBuilders = useCallback(async () => {
    try {
      const res = await fetch("/api/builders-new");
      if (res.ok) {
        const data = await res.json();
        setNewBuilders(data.builders || []);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLive();
    fetchNewBuilders();
    const statsInterval = setInterval(fetchStats, 30000);
    const liveInterval = setInterval(fetchLive, 15000);
    const newInterval = setInterval(fetchNewBuilders, 60000);
    return () => { clearInterval(statsInterval); clearInterval(liveInterval); clearInterval(newInterval); };
  }, [fetchStats, fetchLive, fetchNewBuilders]);

  const enrichedBuilders = useMemo(() => {
    return builders.map((b) => {
      const stat = statsMap[b.address.toLowerCase()];
      return { ...b, stat };
    });
  }, [builders, statsMap]);

  const combinedBuilders = useMemo(() => {
    const seen = new Set<string>();
    const merged: Array<Builder & { stat?: BuilderStat; isNew?: boolean; source?: "token" | "x"; deployedTokens?: DeployedToken[] }> = [];
    for (const nb of newBuilders) {
      if (nb.address) {
        const key = nb.address.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
      }
      merged.push({
        ...nb,
        stat: nb.stat
          ? {
              address: nb.address || "",
              balance: nb.stat.balanceEth,
              balanceFormatted: nb.stat.balanceEth,
              balanceUsd: nb.stat.balanceUsd,
              txCount: nb.stat.txCount,
              tokenCount: nb.stat.tokenTransfers,
              isContract: nb.stat.isContract,
              lastTxTimestamp: nb.stat.lastTxTimestamp,
              ethPrice: nb.stat.ethPrice,
              name: nb.stat.name,
              isVerified: nb.stat.isVerified,
              tokenSymbol: nb.stat.tokenSymbol,
            }
          : undefined,
      });
    }
    for (const b of enrichedBuilders) {
      const key = b.address.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(b);
    }
    return merged;
  }, [newBuilders, enrichedBuilders]);

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
    const list = q
      ? combinedBuilders.filter((b) => {
          const fields = [b.name, b.twitter, b.ens, b.address, ...(b.tags || [])].filter(Boolean).map((f) => f!.toLowerCase());
          return fields.some((f) => f.includes(q));
        })
      : combinedBuilders;

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
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
  }, [combinedBuilders, filter, sortBy]);

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
          <SearchBar compact value={filter} onValueChange={setFilter} />
        </div>
        <button
          onClick={() => { setStatsLoading(true); fetchStats(); fetchLive(); fetchNewBuilders(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
        >
          <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

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
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
              Live Builders
            </span>
            <span className="opacity-80">({combinedBuilders.length})</span>
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
            key={`${b.address || b.twitter || "x"}-${i}`}
            href={b.address ? `/builder/${b.address.toLowerCase()}` : "#"}
            className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 transition-all duration-200 hover:shadow-[0_0_20px_var(--accent-glow)] fade-in"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            role="listitem"
            aria-label={`${b.name}${b.description ? ` — ${b.description.slice(0, 100)}` : ''}. ${b.stat ? `${b.stat.txCount} transactions, ${b.stat.balanceFormatted} ETH` : 'Loading stats...'}`}
          >
            <div className="flex items-start gap-3">
              <AddressAvatar address={b.address || ""} size={44} handle={b.twitter} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{b.name}</span>
                  {b.isNew && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 flex-shrink-0 font-mono animate-pulse">NEW</span>
                  )}
                  {b.source === "x" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20 flex-shrink-0 font-mono">X</span>
                  )}
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
                          {b.stat.tokenCount} transfers
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

                {b.deployedTokens && b.deployedTokens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {b.deployedTokens.slice(0, 3).map((t) => (
                      <Link
                        key={t.address}
                        href={`/token/${t.address}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors font-mono"
                      >
                        {t.symbol}
                      </Link>
                    ))}
                    {b.deployedTokens.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)]">
                        +{b.deployedTokens.length - 3}
                      </span>
                    )}
                  </div>
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
          Stats refresh every 30s · Network block every 15s · Last: {lastRefresh.toLocaleTimeString()}
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


