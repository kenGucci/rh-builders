"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowRightLeft, Wallet, AlertTriangle, ShieldCheck, ExternalLink, TrendingUp, Coins, FileCode } from "lucide-react";

interface Stats {
  totalTransactions: number;
  contractsDeployed: number;
  tokenTransfers: number;
  coinBalance: string;
  coinBalanceUsd: string;
  ethPrice: number;
  isVerified: boolean;
  isScam: boolean;
  ensDomain: string | null;
  name: string | null;
  reputation: string;
  hasTokens: boolean;
}

interface TokenBalanceInfo {
  tokenSymbol: string;
  holderBalance: string;
  holderBalanceUsd: string;
  tokenPrice: number;
  tokenIcon: string | null;
  tokenName: string;
}

interface TotalRewardsInfo {
  totalClaimedUsd: number;
  tokenCount: number;
  claimCount: number;
}

const POLL_INTERVAL = 30000;

export default function StatsBar({ address, tokenBalance, totalRewards }: { address: string; tokenBalance?: TokenBalanceInfo | null; totalRewards?: TotalRewardsInfo | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [balanceFlash, setBalanceFlash] = useState(false);
  const prevBalanceRef = useRef<string>("");

  const statsRef = useRef<Stats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?address=${address}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (prevBalanceRef.current && data.coinBalance !== prevBalanceRef.current) {
        setBalanceFlash(true);
        setTimeout(() => setBalanceFlash(false), 1500);
      }
      prevBalanceRef.current = data.coinBalance;
      statsRef.current = data;
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      if (!statsRef.current) {
        const fallback: Stats = {
          totalTransactions: 0, contractsDeployed: 0, tokenTransfers: 0,
          coinBalance: "0", coinBalanceUsd: "0", ethPrice: 0,
          isVerified: false, isScam: false, ensDomain: null, name: null,
          reputation: "unknown", hasTokens: false,
        };
        statsRef.current = fallback;
        setStats(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    setLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [address, fetchStats]);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="status" aria-label="Loading address statistics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} aria-hidden="true" />
        ))}
        <span className="sr-only">Loading address statistics from Blockscout...</span>
      </div>
    );
  }

  const ethBalance = stats ? (Number(stats.coinBalance) / 1e18).toFixed(4) : "0";
  const balanceUsd = stats ? Number(stats.coinBalanceUsd || 0) : 0;

  return (
    <div className="space-y-3">
      {/* Badges row */}
      {stats && (stats.isScam || stats.isVerified || stats.ensDomain || (stats.name && stats.name !== "")) && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Address reputation and identity badges">
          {stats.isScam && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400" role="listitem" aria-label="Warning: This address has been reported as a scam">
              <AlertTriangle size={12} aria-hidden="true" />
              Reported as scam
            </div>
          )}
          {stats.isVerified && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400" role="listitem" aria-label="This contract is verified on Blockscout">
              <ShieldCheck size={12} aria-hidden="true" />
              Verified Contract
            </div>
          )}
          {stats.ensDomain && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)]" role="listitem" aria-label={`ENS domain: ${stats.ensDomain}`}>
              <ExternalLink size={12} aria-hidden="true" />
              {stats.ensDomain}
            </div>
          )}
          {stats.name && !stats.ensDomain && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)]" role="listitem" aria-label={`Name: ${stats.name}`}>
              {stats.name}
            </div>
          )}
        </div>
      )}

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]" role="status" aria-label="Live on-chain stats for Robinhood Chain">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" aria-hidden="true" />
        <span className="text-green-400 font-medium">LIVE</span>
        <span className="inline-flex items-center px-1.5 py-px rounded bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[8px] font-bold text-[var(--accent)] uppercase tracking-wider">Beta</span>
        <span>· Robinhood Chain (4663)</span>
        {lastUpdated && (
          <span className="ml-auto" aria-label={`Last updated at ${lastUpdated.toLocaleTimeString()}`}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className={`grid gap-3 ${tokenBalance ? "grid-cols-2 md:grid-cols-5" : totalRewards && totalRewards.totalClaimedUsd > 0 ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"}`} role="list" aria-label="Address statistics">
        {tokenBalance ? (
          <StatCard
            label={`${tokenBalance.tokenName} Balance`}
            value={`${tokenBalance.holderBalance} $${tokenBalance.tokenSymbol}`}
            subValue={Number(tokenBalance.holderBalanceUsd) > 0 ? `$${Number(tokenBalance.holderBalanceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0"}
            icon={<Coins size={14} aria-hidden="true" />}
            accent
            flash={balanceFlash}
            source="ERC-20 Token"
            ariaLabel={`${tokenBalance.tokenName} balance: ${tokenBalance.holderBalance} ${tokenBalance.tokenSymbol}, worth ${tokenBalance.holderBalanceUsd} USD`}
          />
        ) : totalRewards && totalRewards.totalClaimedUsd > 0 ? (
          <StatCard
            label="Total Rewards"
            value={`$${totalRewards.totalClaimedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            subValue={`${totalRewards.tokenCount} token${totalRewards.tokenCount !== 1 ? "s" : ""} · ${totalRewards.claimCount} claims`}
            icon={<Coins size={14} aria-hidden="true" />}
            accent
            flash={balanceFlash}
            source="Creator Rewards"
            ariaLabel={`Total creator rewards: $${totalRewards.totalClaimedUsd} from ${totalRewards.tokenCount} tokens`}
          />
        ) : (
          <StatCard
            label="ETH Balance"
            value={`Ξ ${ethBalance}`}
            subValue={balanceUsd > 0 ? `$${balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0"}
            icon={<Wallet size={14} aria-hidden="true" />}
            accent
            flash={balanceFlash}
            source="Blockscout v2"
            ariaLabel={`ETH balance: ${ethBalance} ETH, worth ${balanceUsd} USD`}
          />
        )}
        <StatCard
          label="Transactions"
          value={(stats?.totalTransactions ?? 0).toLocaleString()}
          icon={<ArrowRightLeft size={14} aria-hidden="true" />}
          source="Blockscout v1"
          ariaLabel={`Total transactions: ${stats?.totalTransactions ?? 0}`}
        />
        <StatCard
          label="Token Activity"
          value={(stats?.tokenTransfers ?? 0).toLocaleString()}
          icon={<Coins size={14} aria-hidden="true" />}
          source="ERC-20 transfers"
          ariaLabel={`Token transfers: ${stats?.tokenTransfers ?? 0}`}
        />
        <StatCard
          label="ETH Price"
          value={stats?.ethPrice ? `$${stats.ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "N/A"}
          icon={<TrendingUp size={14} aria-hidden="true" />}
          source="Blockscout v2"
          ariaLabel={`Current ETH price: ${stats?.ethPrice ? `$${stats.ethPrice}` : 'unavailable'}`}
        />
        {(stats?.contractsDeployed ?? 0) > 0 && (
          <StatCard
            label="Contracts Deployed"
            value={(stats?.contractsDeployed ?? 0).toLocaleString()}
            icon={<FileCode size={14} aria-hidden="true" />}
            source="Contract creation"
            ariaLabel={`Contracts deployed: ${stats?.contractsDeployed ?? 0}`}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, accent, flash, source, ariaLabel }: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  accent?: boolean;
  flash?: boolean;
  source?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`bg-[var(--surface)] border rounded-xl p-4 text-center transition-all duration-300 ${
        accent
          ? "border-[var(--accent)]/30 shadow-[0_0_12px_var(--accent-glow)] live-pulse"
          : "border-[var(--border)] hover:border-[var(--accent)]/20 hover-glow"
      }`}
      role="listitem"
      aria-label={ariaLabel || `${label}: ${value}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-[var(--text-muted)] mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold count-animate ${flash ? "balance-flash" : ""} ${accent ? "gradient-text" : "text-[var(--foreground)]"}`}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{subValue}</div>
      )}
      {source && (
        <div className="text-[8px] text-[var(--text-muted)] mt-1 opacity-50">{source}</div>
      )}
    </div>
  );
}
