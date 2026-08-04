"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import {
  Wallet, Coins, TrendingUp, ArrowUpRight, RefreshCw,
  BadgeCheck, ExternalLink, Link2, Copy, Check, Clock,
} from "lucide-react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import AddressAvatar from "@/components/AddressAvatar";
import StockLogo from "@/components/StockLogo";

interface Holding {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceRaw: string;
  icon: string | null;
  price: number;
  usdValue: number;
  ethValue: number;
}

interface Trade {
  txHash: string;
  side: "buy" | "sell";
  symbol: string;
  name: string;
  tokenAddress: string;
  amountFormatted: string;
  usdValue: number;
  ethValue: number;
  timestamp: string;
  from: string;
  to: string;
}

interface ProfileData {
  address: string;
  eth: { balance: number; balanceUsd: number; usdPrice: number };
  portfolio: {
    totalStockUsd: number;
    totalStockEth: number;
    totalUsd: number;
    totalEth: number;
    holdingsCount: number;
    tradeCount: number;
  };
  holdings: Holding[];
  trades: Trade[];
  updatedAt: string;
}

interface XUser {
  id: string;
  name?: string;
  x_handle?: string;
  email?: string;
  provider?: string;
}

const X_BRAND = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function fmtEth(n: number): string {
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH`;
  if (n >= 1) return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} ETH`;
  if (n >= 0.001) return `${n.toLocaleString(undefined, { maximumFractionDigits: 5 })} ETH`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 8 })} ETH`;
}

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPrice(p: number): string {
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function shortAddr(a: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/profile?address=${address}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      setXUser(data.user || null);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    setProfile(null);
    fetchProfile();
    const interval = setInterval(fetchProfile, 20000);
    return () => clearInterval(interval);
  }, [fetchProfile]);

  useEffect(() => {
    fetchMe();
    const interval = setInterval(fetchMe, 60000);
    return () => clearInterval(interval);
  }, [fetchMe]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const liveEth = ethBalance ? Number(formatUnits(ethBalance.value, ethBalance.decimals)) : profile?.eth.balance ?? 0;
  const liveEthUsd = liveEth * (profile?.eth.usdPrice ?? 1873);
  const totalEth = (profile?.portfolio.totalStockEth ?? 0) + liveEth;
  const totalUsd = (profile?.portfolio.totalStockUsd ?? 0) + liveEthUsd;

  if (!isConnected || !address) {
    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto">
            <Wallet size={28} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold mb-1">Your Profile</h1>
            <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
              Connect your wallet to see your stock token holdings, their value in ETH, your
              live buy &amp; sell history, and your connected X identity.
            </p>
          </div>
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <AddressAvatar address={address} size={72} className="rounded-2xl" handle={xUser?.x_handle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold truncate">
              {xUser?.name || shortAddr(address)}
            </h1>
            {xUser?.x_handle && (
              <a
                href={`https://x.com/${xUser.x_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-semibold border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors"
              >
                {X_BRAND}
                @{xUser.x_handle}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-[var(--text-muted)]">
            <span>{shortAddr(address)}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              aria-label="Copy address"
            >
              {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
            </button>
            <a
              href={`https://robinhoodchain.blockscout.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              aria-label="View on Blockscout"
            >
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
            Live portfolio · Robinhood Chain (4663)
          </div>
        </div>

        {/* X identity */}
        {xUser?.x_handle ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-right">
            <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center justify-end gap-1">
              <BadgeCheck size={11} className="text-[var(--accent)]" />
              Connected X
            </div>
            <a
              href={`https://x.com/${xUser.x_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--accent)] hover:underline flex items-center justify-end gap-1.5"
            >
              {X_BRAND}
              @{xUser.x_handle}
            </a>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{xUser.name}</div>
          </div>
        ) : (
          <a
            href="/api/auth/x?from=/profile"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-xs font-semibold text-white hover:border-white/40 transition-all"
          >
            {X_BRAND}
            Connect X
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Wallet size={16} />}
          label="Portfolio Value"
          value={fmtEth(totalEth)}
          sub={fmtUsd(totalUsd)}
          accent
        />
        <StatCard
          icon={<Coins size={16} />}
          label="Stock Holdings"
          value={String(profile?.portfolio.holdingsCount ?? 0)}
          sub={`${profile?.portfolio.holdingsCount ?? 0} ${(profile?.portfolio.holdingsCount ?? 0) === 1 ? "token" : "tokens"} held`}
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Total Trades"
          value={String(profile?.portfolio.tradeCount ?? 0)}
          sub="buy + sell history"
        />
        <StatCard
          icon={<Coins size={16} />}
          label="ETH Balance"
          value={`${liveEth.toLocaleString(undefined, { maximumFractionDigits: 5 })} ETH`}
          sub={fmtUsd(liveEthUsd)}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Coins size={15} className="text-[var(--accent)]" />
          My Stock Holdings
        </h2>
        <button
          onClick={() => { setLoading(true); fetchProfile().finally(() => setLoading(false)); }}
          className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Holdings */}
      <section aria-label="Stock token holdings">
        {loading && profile === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-sm text-red-400">
            Failed to load portfolio. Please try again.
          </div>
        ) : !profile || profile.holdings.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
              <Coins size={20} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium mb-1">No stock holdings yet</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Buy stock tokens on the market and they will appear here with live ETH value.
            </p>
            <Link href="/market" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline">
              Explore the market <ArrowUpRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.holdings.map((h) => (
              <div key={h.address} className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 hover:border-[var(--accent)]/25 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <StockLogo symbol={h.symbol} logo={h.icon ?? undefined} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{h.symbol}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
                        STOCK
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{h.name}</div>
                  </div>
                  <Link
                    href={`/stock/${h.symbol}`}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] transition-colors"
                    aria-label={`View ${h.symbol}`}
                  >
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-[var(--bg-card)]/60 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5">
                    <div className="text-[var(--text-muted)]">Balance</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {Number(h.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {h.symbol}
                    </div>
                  </div>
                  <div className="bg-[var(--bg-card)]/60 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5">
                    <div className="text-[var(--text-muted)]">Price</div>
                    <div className="text-xs font-semibold mt-0.5">{fmtPrice(h.price)}</div>
                  </div>
                  <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/15 rounded-lg px-2.5 py-1.5">
                    <div className="text-[var(--text-muted)]">Value (ETH)</div>
                    <div className="text-xs font-bold text-[var(--accent)] mt-0.5">{fmtEth(h.ethValue)}</div>
                  </div>
                  <div className="bg-[var(--bg-card)]/60 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5">
                    <div className="text-[var(--text-muted)]">Value (USD)</div>
                    <div className="text-xs font-semibold mt-0.5">{fmtUsd(h.usdValue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trade history */}
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <TrendingUp size={15} className="text-[var(--accent)]" />
        Buy &amp; Sell History
      </h2>
      <section aria-label="Buy and sell history" className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {loading && profile === null ? (
          <div className="space-y-1.5 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-shimmer" style={{ background: "var(--bg-card)" }} />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-400">Failed to load trade history.</div>
        ) : !profile || profile.trades.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
              <Link2 size={20} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium mb-1">No trades yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Your on-chain stock token buys and sells will show here in real time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {profile.trades.slice(0, 50).map((t) => (
              <a
                key={`${t.txHash}-${t.side}-${t.timestamp}`}
                href={`https://robinhoodchain.blockscout.com/tx/${t.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-card)] transition-colors"
              >
                <span className={`shrink-0 w-14 text-center text-[9px] font-bold rounded-md py-1 ${t.side === "buy" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {t.side === "buy" ? "BUY" : "SELL"}
                </span>
                <StockLogo symbol={t.symbol} size={30} className="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold">
                    {t.symbol}
                    <span className="font-normal text-[var(--text-muted)]"> · {Number(t.amountFormatted).toLocaleString(undefined, { maximumFractionDigits: 6 })} {t.symbol}</span>
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                    <Clock size={9} />
                    {timeAgo(t.timestamp)} · {shortAddr(t.from)} → {shortAddr(t.to)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-[var(--accent)]">{fmtEth(t.ethValue)}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{fmtUsd(t.usdValue)}</div>
                </div>
                <ExternalLink size={11} className="text-[var(--text-muted)] flex-shrink-0" />
              </a>
            ))}
          </div>
        )}
      </section>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        ETH values are estimates based on live token prices · Data updates every 20s · Executes on Robinhood Chain (4663)
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-[var(--surface)] border rounded-2xl p-4 ${accent ? "border-[var(--accent)]/25" : "border-[var(--border)]"}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 ${accent ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold ${accent ? "gradient-text" : ""}`}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>
    </div>
  );
}
