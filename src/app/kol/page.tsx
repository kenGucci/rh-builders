"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users, TrendingUp, Activity, Search, ArrowUpRight, ExternalLink,
  Zap, Star, Clock, RefreshCw, Shield, ChevronDown, ChevronUp,
  BarChart3, DollarSign, Globe, Wallet, TrendingDown, X, Flame, Trophy,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";

interface KOLActivity {
  hash: string;
  type: string;
  method: string;
  value: string;
  timestamp: string;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenIcon: string | null;
  from: string;
  to: string;
  direction: "in" | "out" | "self";
  chain: string;
}

interface TopToken {
  address: string;
  name: string;
  symbol: string;
  icon: string | null;
  interactionCount: number;
  totalVolumeUsd: string;
  lastInteraction: string;
  chain: string;
}

interface KOLProfile {
  address: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  description: string;
  tags: string[];
  followers: number | null;
  influence: number | null;
  socialScore: number | null;
  verified: boolean;
  networks: string[];
  totalTokensTraded: number;
  totalVolumeUsd: string;
  dailyPnl: string;
  dailyPnlPercent: number;
  winRate: number | null;
  recentActivity: KOLActivity[];
  topTokens: TopToken[];
  socialActivity: unknown[];
  balanceEth: string;
  balanceUsd: string;
  rank?: number;
  pnlUsd: string;
  pnlPercent: number;
  totalTxs: number;
  tokenCount: number;
  portfolioValue: string;
}

function timeAgo(timestamp: string) {
  if (!timestamp) return "";
  const ts = timestamp.includes("T") ? new Date(timestamp).getTime() / 1000 : parseInt(timestamp);
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatFollowers(n: number | null): string {
  if (n === null) return "";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatUsd(n: string | number): string {
  const val = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(val)) return "$0";
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function PnlBadge({ pnl, pnlPercent }: { pnl: string; pnlPercent: number }) {
  const val = parseFloat(pnl);
  const isPositive = val > 0;
  const isZero = val === 0 || isNaN(val);

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isZero ? "bg-gray-500/10 text-gray-400" :
      isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
    }`}>
      {isZero ? <Minus size={8} /> : isPositive ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
      {isZero ? "0%" : `${isPositive ? "+" : ""}${pnlPercent.toFixed(1)}%`}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-black text-yellow-400">1</div>;
  if (rank === 2) return <div className="w-7 h-7 rounded-full bg-gray-300/20 flex items-center justify-center text-[10px] font-black text-gray-300">2</div>;
  if (rank === 3) return <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-black text-orange-400">3</div>;
  if (rank <= 10) return <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">{rank}</div>;
  return <div className="w-7 h-7 rounded-full bg-[var(--surface)] flex items-center justify-center text-[9px] font-medium text-[var(--text-muted)]">{rank}</div>;
}

function KolCard({ kol, onClick }: { kol: KOLProfile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-[var(--accent)]/30 hover:shadow-[0_4px_20px_rgba(0,200,5,0.05)] transition-all duration-300 group"
    >
      <div className="flex items-center gap-3">
        <RankBadge rank={kol.rank || 0} />

        <div className="relative flex-shrink-0">
          {kol.avatar ? (
            <img src={kol.avatar} alt={kol.name} className="w-11 h-11 rounded-full border border-[var(--border)] object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--accent)]">{kol.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{kol.name}</span>
            {kol.handle && (
              <a
                href={`https://x.com/${kol.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-[var(--accent)]/70 hover:text-[var(--accent)] hover:underline flex items-center gap-0.5"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                @{kol.handle}
              </a>
            )}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5 max-w-md">{kol.description}</div>

          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
            {kol.followers !== null && kol.followers > 0 && (
              <span className="text-[var(--foreground)] flex items-center gap-1 font-medium">
                <Users size={8} />
                {formatFollowers(kol.followers)}
              </span>
            )}
            {kol.totalTxs > 0 && (
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <Activity size={8} />
                {kol.totalTxs} txs
              </span>
            )}
            {kol.networks.length > 0 && (
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <Globe size={8} />
                {kol.networks.join(" + ")}
              </span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0 space-y-1">
          <PnlBadge pnl={kol.pnlUsd} pnlPercent={kol.pnlPercent} />
          {kol.followers !== null && (
            <div className="text-[10px] text-[var(--text-muted)]">{formatFollowers(kol.followers)}</div>
          )}
          {kol.tokenCount > 0 && (
            <div className="text-[9px] text-[var(--text-muted)]">{kol.tokenCount} tokens</div>
          )}
        </div>
      </div>
    </button>
  );
}

function KolDetailPanel({ kol, onClose }: { kol: KOLProfile; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "tokens">("overview");
  const hasOnChain = kol.recentActivity.length > 0 || kol.topTokens.length > 0 || kol.totalTxs > 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden fade-in">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {kol.avatar ? (
              <img src={kol.avatar} alt={kol.name} className="w-14 h-14 rounded-full border-2 border-[var(--border)] object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border-2 border-[var(--accent)]/20 flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--accent)]">{kol.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{kol.name}</h2>
                {kol.handle && (
                  <a href={`https://x.com/${kol.handle}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    @{kol.handle}
                  </a>
                )}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5 max-w-lg">{kol.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {kol.tags.map((tag) => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/5 text-[var(--accent)]/70 border border-[var(--accent)]/10">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors">
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)]">
        <div className="p-3 bg-[var(--surface)] text-center">
          <DollarSign size={14} className="mx-auto mb-1 text-green-400" />
          <div className="text-[10px] text-[var(--text-muted)]">PnL</div>
          <div className={`text-sm font-bold ${parseFloat(kol.pnlUsd) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {parseFloat(kol.pnlUsd) >= 0 ? "+" : ""}{formatUsd(kol.pnlUsd)}
          </div>
          <PnlBadge pnl={kol.pnlUsd} pnlPercent={kol.pnlPercent} />
        </div>
        <div className="p-3 bg-[var(--surface)] text-center">
          <Wallet size={14} className="mx-auto mb-1 text-blue-400" />
          <div className="text-[10px] text-[var(--text-muted)]">Portfolio</div>
          <div className="text-sm font-bold">{formatUsd(kol.portfolioValue)}</div>
          <div className="text-[9px] text-[var(--text-muted)]">{parseFloat(kol.balanceEth).toFixed(2)} ETH</div>
        </div>
        <div className="p-3 bg-[var(--surface)] text-center">
          <Activity size={14} className="mx-auto mb-1 text-[var(--accent)]" />
          <div className="text-[10px] text-[var(--text-muted)]">Transactions</div>
          <div className="text-sm font-bold">{kol.totalTxs.toLocaleString()}</div>
          <div className="text-[9px] text-[var(--text-muted)]">{kol.networks.join(" + ") || "—"}</div>
        </div>
        <div className="p-3 bg-[var(--surface)] text-center">
          <Star size={14} className="mx-auto mb-1 text-yellow-400" />
          <div className="text-[10px] text-[var(--text-muted)]">Tokens Traded</div>
          <div className="text-sm font-bold">{kol.tokenCount}</div>
          {kol.winRate !== null && (
            <div className="text-[9px] text-[var(--text-muted)]">{kol.winRate}% win rate</div>
          )}
        </div>
      </div>

      {/* Social Stats */}
      {kol.followers !== null && kol.followers > 0 && (
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center gap-6 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Users size={11} className="text-[var(--accent)]" />
            <span className="font-medium text-[var(--foreground)]">{formatFollowers(kol.followers)}</span> followers
          </span>
          {kol.totalVolumeUsd !== "0" && (
            <span className="flex items-center gap-1.5">
              <BarChart3 size={11} className="text-blue-400" />
              Volume: <span className="font-medium text-[var(--foreground)]">{kol.totalVolumeUsd} ETH</span>
            </span>
          )}
          {kol.recentActivity.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-orange-400" />
              Last active: <span className="font-medium text-[var(--foreground)]">{timeAgo(kol.recentActivity[0]?.timestamp)}</span>
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-t border-[var(--border)]">
        {(["overview", "activity", "tokens"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-medium text-center transition-colors border-b-2 ${
              activeTab === tab
                ? "text-[var(--accent)] border-[var(--accent)]"
                : "text-[var(--text-muted)] border-transparent hover:text-[var(--foreground)]"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "activity" ? `Activity (${kol.recentActivity.length})` : `Tokens (${kol.topTokens.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* X Profile Card */}
            {kol.handle && (
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  {kol.avatar && <img src={kol.avatar} alt={kol.name} className="w-10 h-10 rounded-full object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{kol.name}</div>
                    <a href={`https://x.com/${kol.handle}`} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-[var(--accent)] hover:underline">@{kol.handle}</a>
                  </div>
                  {kol.followers !== null && (
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatFollowers(kol.followers)}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">followers</div>
                    </div>
                  )}
                </div>
                {kol.description && (
                  <div className="text-[11px] text-[var(--text-muted)] mt-2 line-clamp-3">{kol.description}</div>
                )}
              </div>
            )}

            {/* On-chain summary */}
            {hasOnChain && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                  <BarChart3 size={14} className="mx-auto mb-1 text-[var(--accent)]" />
                  <div className="text-[10px] text-[var(--text-muted)]">Transactions</div>
                  <div className="text-xs font-bold text-[var(--foreground)]">{kol.totalTxs}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                  <Star size={14} className="mx-auto mb-1 text-yellow-400" />
                  <div className="text-[10px] text-[var(--text-muted)]">Tokens</div>
                  <div className="text-xs font-bold text-[var(--foreground)]">{kol.tokenCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center">
                  <Globe size={14} className="mx-auto mb-1 text-blue-400" />
                  <div className="text-[10px] text-[var(--text-muted)]">Networks</div>
                  <div className="text-xs font-bold text-[var(--foreground)]">{kol.networks.length || "—"}</div>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
              {kol.address && (
                <a href={`https://robinhoodchain.blockscout.com/address/${kol.address}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:underline">
                  Blockscout <ExternalLink size={10} />
                </a>
              )}
              {kol.handle && (
                <a href={`https://x.com/${kol.handle}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  X Profile <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-1.5">
            {kol.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">No recent on-chain activity.</div>
            ) : (
              kol.recentActivity.slice(0, 10).map((tx, i) => (
                <a
                  key={`${tx.hash}-${i}`}
                  href={tx.chain === "ethereum" ? `https://eth.blockscout.com/tx/${tx.hash}` : `https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.direction === "in" ? "bg-green-500/10" : tx.direction === "out" ? "bg-red-500/10" : "bg-[var(--accent)]/10"
                  }`}>
                    {tx.direction === "in" ? (
                      <ArrowUp size={12} className="text-green-400" />
                    ) : tx.direction === "out" ? (
                      <ArrowDown size={12} className="text-red-400" />
                    ) : (
                      <ArrowUpRight size={12} className="text-[var(--accent)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--foreground)] truncate">
                      {tx.method || "Transfer"}
                      {tx.tokenSymbol && <span className="text-[var(--accent)]"> · {tx.tokenSymbol}</span>}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-1">
                      {timeAgo(tx.timestamp)}
                      <span className={`text-[8px] px-1 py-0.5 rounded ${
                        tx.chain === "ethereum" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {tx.chain === "ethereum" ? "ETH" : "RHC"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-[11px] font-mono ${tx.direction === "in" ? "text-green-400" : "text-red-400"}`}>
                      {tx.direction === "in" ? "+" : "-"}{tx.value} ETH
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="space-y-2">
            {kol.topTokens.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">No token interactions recorded.</div>
            ) : (
              kol.topTokens.map((token) => (
                <a
                  key={`${token.address}-${token.chain}`}
                  href={token.chain === "ethereum" ? `https://eth.blockscout.com/token/${token.address}` : `https://robinhoodchain.blockscout.com/token/${token.address}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors group"
                >
                  {token.icon ? (
                    <img src={token.icon} alt={token.symbol} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                      {token.symbol?.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">{token.symbol}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{token.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[11px] font-medium text-[var(--foreground)]">×{token.interactionCount}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{token.totalVolumeUsd !== "~" ? `$${token.totalVolumeUsd}` : "—"}</div>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                    token.chain === "ethereum" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                  }`}>
                    {token.chain === "ethereum" ? "ETH" : "RHC"}
                  </span>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KOLPage() {
  const [kols, setKols] = useState<KOLProfile[]>([]);
  const [leaderboard, setLeaderboard] = useState<KOLProfile[]>([]);
  const [trending, setTrending] = useState<KOLProfile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [ethPrice, setEthPrice] = useState(0);
  const [searching, setSearching] = useState(false);
  const [selectedKol, setSelectedKol] = useState<KOLProfile | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (category?: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/kol?category=${category || filter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.kols) setKols(data.kols);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.trending) setTrending(data.trending);
      if (data.categories) setCategories(data.categories);
      if (data.ethPrice) setEthPrice(data.ethPrice);
      setLastUpdated(new Date());
    } catch {
      console.error("Failed to fetch KOL data");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchData();
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/kol?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.kols) setKols(data.kols);
      setLeaderboard([]);
      setTrending([]);
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));

    // Auto-refresh every 60 seconds (silent background)
    intervalRef.current = setInterval(() => {
      fetchData(undefined, true);
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(search);
  };

  const handleClearSearch = () => {
    setSearch("");
    fetchData();
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">KOL Hub</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Top 50 ranked KOLs — real X profiles, real on-chain data, real PnL
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ethPrice > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[10px] flex items-center gap-1.5">
              <Globe size={10} className="text-[var(--accent)]" />
              <span className="text-[var(--text-muted)]">ETH</span>
              <span className="font-bold text-[var(--foreground)]">${ethPrice.toLocaleString()}</span>
            </div>
          )}
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

      {/* Selected KOL Detail */}
      {selectedKol && (
        <KolDetailPanel kol={selectedKol} onClose={() => setSelectedKol(null)} />
      )}

      {/* Top 50 Leaderboard */}
      {leaderboard.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="text-sm font-semibold">Top 50 Leaderboard</h2>
            <span className="text-[10px] text-[var(--text-muted)]">({leaderboard.length} ranked by PnL + social + on-chain)</span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
                {[1, 0, 2].map((idx) => {
                  const kol = leaderboard[idx];
                  if (!kol) return <div key={idx} />;
                  return (
                    <button
                      key={kol.address || kol.handle}
                      onClick={() => setSelectedKol(kol)}
                      className={`bg-[var(--surface)] p-4 text-center hover:bg-[var(--bg-card-hover)] transition-colors ${
                        idx === 0 ? "pt-6" : ""
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        {kol.avatar ? (
                          <img src={kol.avatar} alt={kol.name} className={`rounded-full object-cover border-2 ${
                            idx === 0 ? "w-16 h-16 border-yellow-400" : "w-12 h-12 border-gray-400"
                          }`} />
                        ) : (
                          <div className={`rounded-full flex items-center justify-center font-black ${
                            idx === 0 ? "w-16 h-16 bg-yellow-500/20 text-yellow-400 text-lg" :
                            idx === 1 ? "w-12 h-12 bg-gray-300/20 text-gray-300 text-sm" :
                            "w-12 h-12 bg-orange-500/20 text-orange-400 text-sm"
                          }`}>
                            #{idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-bold truncate">{kol.name}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate">{kol.handle ? `@${kol.handle}` : "on-chain"}</div>
                      <PnlBadge pnl={kol.pnlUsd} pnlPercent={kol.pnlPercent} />
                      {kol.followers !== null && (
                        <div className="text-[9px] text-[var(--text-muted)] mt-1">{formatFollowers(kol.followers)} followers</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Remaining 4-50 */}
            <div className="divide-y divide-[var(--border)]">
              {leaderboard.slice(3, 50).map((kol) => (
                <button
                  key={kol.address || kol.handle}
                  onClick={() => setSelectedKol(kol)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
                >
                  <RankBadge rank={kol.rank || 0} />

                  <div className="relative flex-shrink-0">
                    {kol.avatar ? (
                      <img src={kol.avatar} alt={kol.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                        {kol.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-[var(--foreground)]">{kol.name}</span>
                      {kol.handle && (
                        <span className="text-[10px] text-[var(--text-muted)]">@{kol.handle}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[var(--text-muted)]">
                      {kol.followers !== null && kol.followers > 0 && (
                        <span className="flex items-center gap-0.5"><Users size={7} />{formatFollowers(kol.followers)}</span>
                      )}
                      {kol.totalTxs > 0 && (
                        <span className="flex items-center gap-0.5"><Activity size={7} />{kol.totalTxs} txs</span>
                      )}
                      {kol.tokenCount > 0 && (
                        <span className="flex items-center gap-0.5"><Star size={7} />{kol.tokenCount} tokens</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <PnlBadge pnl={kol.pnlUsd} pnlPercent={kol.pnlPercent} />
                    {kol.portfolioValue !== "0" && (
                      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{formatUsd(kol.portfolioValue)}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Most Active */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-400" />
            <h2 className="text-sm font-semibold">Most Active</h2>
            <span className="text-[10px] text-[var(--text-muted)]">— ranked by on-chain transactions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trending.slice(0, 8).map((kol) => (
              <button
                key={kol.address || kol.handle}
                onClick={() => setSelectedKol(kol)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 text-left hover:border-[var(--accent)]/30 hover:shadow-[0_4px_20px_rgba(0,200,5,0.05)] transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  {kol.avatar ? (
                    <img src={kol.avatar} alt={kol.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center text-[10px] font-bold text-orange-400">
                      <Flame size={12} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{kol.name}</div>
                    <div className="text-[9px] text-[var(--text-muted)] truncate">{kol.handle ? `@${kol.handle}` : "on-chain"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-0.5 font-medium">
                    <Activity size={8} className="text-orange-400" />
                    {kol.totalTxs} txs
                  </span>
                  {kol.tokenCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star size={8} />
                      {kol.tokenCount} tokens
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] max-w-md">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search 50 KOLs — name, X handle, or tag... (Enter to search)"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 focus:shadow-[0_0_20px_var(--accent-glow)] transition-all"
            />
            {search && (
              <button onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 flex-wrap">
          <button
            onClick={() => { setFilter("all"); fetchData("all"); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              filter === "all" ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => { setFilter(cat); fetchData(cat); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                filter === cat ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* KOL List */}
      {loading || searching ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      ) : kols.length === 0 ? (
        <div className="text-center py-16">
          <Users size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
          <div className="text-sm text-[var(--text-muted)]">No KOLs found matching your search.</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-2">Try a different name, X handle, or tag.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {kols.map((kol, i) => (
            <KolCard key={kol.address || kol.handle} kol={{ ...kol, rank: i + 1 }} onClick={() => setSelectedKol(kol)} />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-[var(--text-muted)] py-4">
        X profiles scraped from public pages · On-chain data from Blockscout · Auto-refreshes every 60s · PnL calculated from balance + activity
      </div>
    </div>
  );
}
