"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, Globe, Bird, MessageCircle,
  Send, RefreshCw, TrendingUp, TrendingDown, Activity,
  Droplets, BarChart3, Users, Clock, Layers, Copy, Check,
  Shield, Zap, ChevronDown,
} from "lucide-react";

interface TokenPair {
  dex: string;
  pairAddress: string;
  quoteSymbol: string;
  priceUsd: string;
  priceNative: string;
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
  url: string;
  pairCreatedAt: number;
}

interface TokenProfile {
  name: string;
  symbol: string;
  address: string;
  imageUrl: string | null;
  websites: Array<{ url: string; label: string }>;
  socials: Array<{ url: string; type: string }>;
  description: string | null;
  pairs: TokenPair[];
  onChain: {
    totalSupply: string | null;
    holders: number | null;
    decimals: number | null;
    tokenType: string | null;
  };
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

function formatSupply(val: string | null): string {
  if (!val) return "N/A";
  const n = Number(val);
  if (n >= 1e18) return `${(n / 1e18).toFixed(2)}T`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(2)}B`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}M`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}K`;
  return n.toLocaleString();
}

function getSocialIcon(type: string) {
  switch (type.toLowerCase()) {
    case "twitter": return Bird;
    case "telegram": return Send;
    case "discord": return MessageCircle;
    default: return Globe;
  }
}

function getSocialColor(type: string) {
  switch (type.toLowerCase()) {
    case "twitter": return "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20";
    case "telegram": return "text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20";
    case "discord": return "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20";
    default: return "text-[var(--text-muted)] bg-[var(--surface)] hover:bg-[var(--bg-card-hover)] border-[var(--border)]";
  }
}

export default function TokenProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [profile, setProfile] = useState<TokenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedPair, setSelectedPair] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/token-profile/${address}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setProfile(data);
      setError("");
    } catch {
      setError("Token not found on Robinhood Chain");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pair = profile?.pairs[selectedPair];

  return (
    <div className="max-w-4xl mx-auto space-y-5 fade-in">
      <Link
        href="/robinhood-tokens"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Tokens
      </Link>

      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
              <div className="h-4 w-32 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
            </div>
          </div>
          <div className="h-48 rounded-2xl animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="text-[var(--text-muted)] text-sm mb-2">{error}</div>
          <button
            onClick={() => { setLoading(true); fetchProfile(); }}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : profile ? (
        <>
          {/* Gradient Header */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.symbol}
                    className="w-20 h-20 rounded-2xl flex-shrink-0 border-2 border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-2xl font-black text-[var(--accent)] flex-shrink-0 border border-[var(--accent)]/20">
                    {profile.symbol?.slice(0, 2)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black tracking-tight">{profile.symbol}</h1>
                    <span className="text-sm text-[var(--text-muted)] font-medium">{profile.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors"
                    >
                      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </button>

                    <a
                      href={`https://robinhoodchain.blockscout.com/token/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
                    >
                      Blockscout <ExternalLink size={8} />
                    </a>

                    {pair?.url && (
                      <a
                        href={pair.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                      >
                        DexScreener <ExternalLink size={8} />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setLoading(true); fetchProfile(); }}
                  className="p-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {profile.description && (
                <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-4">
                  {profile.description}
                </p>
              )}

              {/* Socials & Websites */}
              {(profile.socials.length > 0 || profile.websites.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.socials.map((s, i) => {
                    const Icon = getSocialIcon(s.type);
                    const colorClass = getSocialColor(s.type);
                    return (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${colorClass}`}
                      >
                        <Icon size={13} />
                        {s.type}
                      </a>
                    );
                  })}
                  {profile.websites.map((w, i) => (
                    <a
                      key={i}
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
                    >
                      <Globe size={13} />
                      {w.label || new URL(w.url).hostname}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price & Stats */}
          {pair && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="stat-block hover-lift">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-[var(--accent)]" />
                  <span className="stat-label">Price</span>
                </div>
                <div className="stat-value">{formatPrice(pair.priceUsd)}</div>
                <div className={`text-[11px] font-mono mt-1 ${pair.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {pair.priceChange24h >= 0 ? "+" : ""}{pair.priceChange24h.toFixed(1)}% 24h
                </div>
              </div>

              <div className="stat-block hover-lift">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={12} className="text-[var(--blue)]" />
                  <span className="stat-label">Market Cap</span>
                </div>
                <div className="stat-value">${formatCompact(pair.marketCap)}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  FDV ${formatCompact(pair.fdv)}
                </div>
              </div>

              <div className="stat-block hover-lift">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets size={12} className="text-[var(--purple)]" />
                  <span className="stat-label">Liquidity</span>
                </div>
                <div className="stat-value">${formatCompact(pair.liquidityUsd)}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  {pair.dex}
                </div>
              </div>

              <div className="stat-block hover-lift">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={12} className="text-[var(--yellow)]" />
                  <span className="stat-label">Volume 24h</span>
                </div>
                <div className="stat-value">${formatCompact(pair.volume24h)}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  1h: ${formatCompact(pair.volume1h)}
                </div>
              </div>
            </div>
          )}

          {/* Buy/Sell Activity */}
          {pair && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                  <Zap size={14} className="text-[var(--accent)]" />
                </div>
                Trading Activity
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">24h Transactions</div>
                  <div className="flex items-center gap-2 text-sm font-mono font-semibold">
                    <span className="text-green-400">{pair.buys24h} buys</span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="text-red-400">{pair.sells24h} sells</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">1h Transactions</div>
                  <div className="flex items-center gap-2 text-sm font-mono font-semibold">
                    <span className="text-green-400">{pair.buys1h} buys</span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="text-red-400">{pair.sells1h} sells</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Buy Pressure</div>
                  <div className="text-sm font-mono font-bold text-[var(--accent)]">
                    {pair.buys24h + pair.sells24h > 0
                      ? Math.round((pair.buys24h / (pair.buys24h + pair.sells24h)) * 100)
                      : 50}%
                  </div>
                </div>
              </div>

              <div className="h-2.5 rounded-full bg-red-500/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500/60 to-green-400/80 transition-all duration-500"
                  style={{
                    width: `${pair.buys24h + pair.sells24h > 0
                      ? Math.round((pair.buys24h / (pair.buys24h + pair.sells24h)) * 100)
                      : 50}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2 font-medium">
                <span className="text-green-400">Buy {pair.buys24h + pair.sells24h > 0 ? Math.round((pair.buys24h / (pair.buys24h + pair.sells24h)) * 100) : 50}%</span>
                <span className="text-red-400">Sell {pair.buys24h + pair.sells24h > 0 ? 100 - Math.round((pair.buys24h / (pair.buys24h + pair.sells24h)) * 100) : 50}%</span>
              </div>
            </div>
          )}

          {/* On-Chain Info */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center">
                <Shield size={14} className="text-[var(--blue)]" />
              </div>
              On-Chain Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Total Supply</div>
                <div className="text-sm font-mono font-bold">{formatSupply(profile.onChain.totalSupply)}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Holders</div>
                <div className="text-sm font-mono font-bold">{profile.onChain.holders?.toLocaleString() || "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Decimals</div>
                <div className="text-sm font-mono font-bold">{profile.onChain.decimals ?? "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Token Type</div>
                <div className="text-sm font-mono font-bold">{profile.onChain.tokenType || "ERC-20"}</div>
              </div>
            </div>
          </div>

          {/* All Pairs */}
          {profile.pairs.length > 1 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="section-header">
                <div className="section-title">
                  <Layers size={14} className="text-[var(--accent)]" />
                  All Trading Pairs
                </div>
                <span className="section-badge">{profile.pairs.length} pairs</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {profile.pairs.map((p, i) => (
                  <button
                    key={p.pairAddress}
                    onClick={() => setSelectedPair(i)}
                    className={`w-full px-5 py-3 flex items-center justify-between text-left hover:bg-[var(--bg-card-hover)] transition-colors ${
                      selectedPair === i ? "bg-[var(--accent)]/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{p.dex}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{p.quoteSymbol} pair</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-mono font-bold">{formatPrice(p.priceUsd)}</div>
                      <div className={`text-[10px] font-mono ${p.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {p.priceChange24h >= 0 ? "+" : ""}{p.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-semibold">Vol ${formatCompact(p.volume24h)}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Liq ${formatCompact(p.liquidityUsd)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pair Created */}
          {pair?.pairCreatedAt && pair.pairCreatedAt > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
              <Clock size={10} />
              Created {timeAgo(pair.pairCreatedAt)}
              <span>·</span>
              <span>{new Date(pair.pairCreatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
