"use client";

import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Layers, Clock, Zap, ArrowUpRight, Users, Activity,
  TrendingUp, Fuel, Shield, Globe, BarChart3, ExternalLink,
  ArrowRight, Sparkles, ChevronRight, Rocket, Eye, Terminal
} from "lucide-react";
import AddressAvatar from "@/components/AddressAvatar";
import AnimatedCounter from "@/components/AnimatedCounter";
import Sparkline from "@/components/Sparkline";
import dynamic from "next/dynamic";

const LiveTransactions = dynamic(() => import("@/components/LiveTransactions"), { ssr: false });
const NewsSection = dynamic(() => import("@/components/NewsSection").catch(() => ({ default: () => null })), { ssr: false });

interface NetworkStats {
  totalBlocks: number;
  totalAddresses: number;
  totalTransactions: number;
  averageBlockTime: number;
  coinPrice: string;
  transactionsToday: string;
  gasPrices: { slow: number; average: number; fast: number };
  marketCap: string;
}

interface SparklineData {
  txs: number[];
  blocks: number[];
  addresses: number[];
  gas: number[];
}

interface BuilderProfile {
  address: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  description: string;
  tags: string[];
  txCount: number;
  tokenCount: number;
  balanceEth: string;
}

export default function Home() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [sparkData, setSparkData] = useState<SparklineData>({ txs: [], blocks: [], addresses: [], gas: [] });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLDivElement>(null);
  const [topBuilders, setTopBuilders] = useState<BuilderProfile[]>([]);

  const fetchBuilders = useCallback(async () => {
    try {
      const res = await fetch("/api/top-builders?limit=8");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = data.builders || [];
      const profiles: BuilderProfile[] = items.map((b: Record<string, unknown>) => ({
        address: (b.address as string) || "",
        name: (b.name as string) || "Unknown",
        handle: (b.handle as string) || null,
        avatar: (b.avatar as string) || null,
        description: (b.description as string) || "",
        tags: (b.tags as string[]) || [],
        txCount: (b.txCount as number) || 0,
        tokenCount: (b.tokenCount as number) || 0,
        balanceEth: (b.balanceEth as string) || "0",
      }));
      setTopBuilders(profiles);
    } catch {}
  }, []);

  useEffect(() => {
    const txHistory: number[] = [];
    const blockHistory: number[] = [];
    const addrHistory: number[] = [];
    const gasHistory: number[] = [];

    function load() {
      fetch("/api/chain-stats")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data) => {
          const txs = data.totalTransactions ?? 0;
          const blocks = data.totalBlocks ?? 0;
          const addrs = data.totalAddresses ?? 0;
          const gas = data.gasPrices?.fast ?? 0;

          txHistory.push(txs);
          blockHistory.push(blocks);
          addrHistory.push(addrs);
          gasHistory.push(gas);
          if (txHistory.length > 12) { txHistory.shift(); blockHistory.shift(); addrHistory.shift(); gasHistory.shift(); }

          setStats({
            totalBlocks: blocks,
            totalAddresses: addrs,
            totalTransactions: txs,
            averageBlockTime: data.avgBlockTime ?? 0,
            coinPrice: data.coinPrice ?? "0",
            transactionsToday: data.txsToday ?? "0",
            gasPrices: data.gasPrices ?? { slow: 0, average: 0, fast: 0 },
            marketCap: data.marketCap ?? "0",
          });
          setSparkData({ txs: [...txHistory], blocks: [...blockHistory], addresses: [...addrHistory], gas: [...gasHistory] });
          setLastUpdate(new Date());
        })
        .catch(() => {})
        .finally(() => setStatsLoaded(true));
    }
    load();
    fetchBuilders();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [fetchBuilders]);

  useEffect(() => {
    let rafId = 0;
    const handleMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          setMousePos({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const trustBadges = useMemo(() => [
    { icon: <Shield size={13} />, text: "Real-time data" },
    { icon: <Globe size={13} />, text: "100 builders tracked" },
    { icon: <BarChart3 size={13} />, text: "Live analytics" },
  ], []);

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <div className="scroll-progress" aria-hidden="true" />

      <div id="main-content" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section
          ref={heroRef}
          className="relative pt-16 sm:pt-24 md:pt-32 pb-12 md:pb-20 text-center overflow-hidden"
          aria-label="Hero"
        >
          {/* Radial glow that follows cursor */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            aria-hidden="true"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(0,200,5,0.06), transparent 60%)`,
            }}
          />

          {/* Floating orbs */}
          <div className="absolute top-20 left-[15%] w-72 h-72 bg-[var(--accent)]/4 rounded-full blur-[100px] floating-orb pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-10 right-[10%] w-96 h-96 bg-emerald-500/3 rounded-full blur-[120px] floating-orb pointer-events-none" style={{ animationDelay: "3s" }} aria-hidden="true" />

          {/* Live badge */}
          <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 backdrop-blur-sm glow-ring mb-8 fade-in" role="status">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-[var(--accent)] uppercase">Live on Robinhood Chain</span>
          </div>

          {/* Title */}
          <h1 className="relative fade-in animate-delay-75">
            <span className="block text-6xl sm:text-7xl md:text-[5.5rem] lg:text-[7rem] font-black tracking-[-0.04em] leading-[0.95]">
              <span className="gradient-text">THE WALL</span>
              <span className="text-[var(--text)] ml-3 sm:ml-4">RH</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="relative mt-6 text-[var(--text-secondary)] text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-balance fade-in animate-delay-150">
            Real-time builder analytics for Robinhood Chain.
            <span className="text-[var(--foreground)] font-medium"> Track every contract, token, and claim </span>
            — all from one place.
          </p>

          {/* Trust badges */}
          <div className="relative flex flex-wrap justify-center gap-3 mt-8 fade-in animate-delay-200">
            {trustBadges.map((badge) => (
              <span key={badge.text} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/20 hover:text-[var(--text-secondary)] transition-all duration-200">
                <span className="text-[var(--accent)]">{badge.icon}</span>
                {badge.text}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 fade-in animate-delay-300">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:brightness-110 transition-all duration-200 shadow-[0_0_30px_rgba(0,200,5,0.15)] hover:shadow-[0_0_40px_rgba(0,200,5,0.25)]"
            >
              <Rocket size={16} />
              View Dashboard
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ── Search ── */}
        <section className="flex justify-center -mt-2 mb-16 fade-in animate-delay-400" aria-label="Search">
          <SearchBar />
        </section>

        {/* ── Network Ticker ── */}
        {statsLoaded && stats && (
          <section className="mb-16 fade-in animate-fill-both" aria-label="Network statistics">
            {/* Ticker bar */}
            <div className="flex items-center justify-center gap-3 md:gap-5 mb-6 flex-wrap">
              <TickerBadge
                dot
                label="ETH"
                value={`$${Number(stats.coinPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                ariaLabel={`ETH price: $${Number(stats.coinPrice).toLocaleString()}`}
              />
              <TickerBadge
                label="Today"
                value={`${Number(stats.transactionsToday).toLocaleString()} txs`}
                ariaLabel={`${stats.transactionsToday} transactions today`}
              />
              <TickerBadge
                className="hidden sm:flex"
                label="Gas"
                value={`${stats.gasPrices.fast} Gwei`}
                ariaLabel={`Fast gas: ${stats.gasPrices.fast} Gwei`}
              />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="list" aria-label="Network metrics">
              <StatCard label="Transactions" value={stats.totalTransactions} sparkData={sparkData.txs} icon={<Zap size={14} />} delay={0} />
              <StatCard label="Blocks" value={stats.totalBlocks} sparkData={sparkData.blocks} icon={<Layers size={14} />} delay={1} />
              <StatCard label="Addresses" value={stats.totalAddresses} sparkData={sparkData.addresses} icon={<Users size={14} />} delay={2} />
              <StatCard label="Block Time" value={stats.averageBlockTime} displayValue={`${(stats.averageBlockTime / 1000).toFixed(1)}s`} sparkData={sparkData.gas} icon={<Clock size={14} />} delay={3} />
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] live-blink" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </section>
        )}

        {/* ── Feature Grid ── */}
        <section className="mb-20 scroll-reveal" aria-label="Features">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Layers size={22} />}
              title="Smart Contracts"
              description="Browse every deployed contract, token, and dApp across Robinhood Chain — verified source, ABI, and creation tx."
              href="/builder"
              cta="View contracts"
            />
            <FeatureCard
              icon={<Clock size={22} />}
              title="Claim History"
              description="Track reward distributions, airdrop receipts, and token claim events with full on-chain proof."
              href="/builder"
              cta="View claims"
            />
            <FeatureCard
              icon={<Zap size={22} />}
              title="Market Data"
              description="Live price feeds, gas tracker, transaction volume, and network health — all refreshed in real time."
              href="/market"
              cta="View market"
            />
          </div>
        </section>

        {/* ── Top On-Chain Builders ── */}
        <section className="mb-20 scroll-reveal" aria-label="Featured builders">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
                <Sparkles size={12} />
                Builders
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Top on-chain builders</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">Real developers and protocols on Robinhood Chain — live from Blockscout</p>
            </div>
            <Link
              href="/builder"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topBuilders.map((b, i) => (
              <Link
                key={b.address || b.handle || i}
                href={b.address ? `/builder/${b.address.toLowerCase()}` : "/builder"}
                className="group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 transition-all duration-300 hover:border-[var(--accent)]/20 hover:shadow-[0_8px_30px_rgba(0,200,5,0.06)] card-stagger"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {b.avatar ? (
                    <img src={b.avatar} alt={b.name} className="w-11 h-11 rounded-full border border-[var(--border)] object-cover" />
                  ) : (
                    <AddressAvatar address={b.address || `0x${i}`} size={44} handle={b.handle ?? undefined} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] truncate group-hover:text-[var(--foreground)] transition-colors">{b.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {b.tags?.slice(0, 2).join(" · ") || "Builder"}
                    </div>
                    {b.handle && (
                      <div className="text-[11px] text-[var(--accent)] mt-0.5 font-medium opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        @{b.handle}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
                {(b.txCount > 0 || b.tokenCount > 0) && (
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-[var(--text-muted)]">
                    {b.txCount > 0 && <span className="flex items-center gap-0.5"><Activity size={7} className="text-[var(--accent)]" />{b.txCount} txs</span>}
                    {b.tokenCount > 0 && <span className="flex items-center gap-0.5"><Zap size={7} className="text-yellow-400" />{b.tokenCount} tokens</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
          <div className="sm:hidden mt-4 text-center">
            <Link href="/builder" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
              View all builders <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── Live Transactions ── */}
        <section className="mb-20 scroll-reveal" aria-label="Recent transactions">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
                <Zap size={12} />
                Live Feed
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Recent transactions</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5">Real-time on-chain activity across Robinhood Chain</p>
            </div>
          </div>
          <LiveTransactions />
        </section>

        {/* ── News ── */}
        <NewsSection />

        {/* ── How It Works ── */}
        <section className="mb-20 scroll-reveal" aria-label="How it works">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
              <Eye size={12} />
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Three steps to full transparency</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search Any Address",
                text: "Enter a wallet address, ENS name, token contract address, or Twitter handle into our search bar. THE WALL instantly conducts a comprehensive scan across the entire Robinhood Chain using Blockscout, intelligently matching your input against verified on-chain records to deliver accurate and instant results.",
              },
              {
                step: "02",
                title: "Explore Builder Profiles",
                text: "Dive deep into detailed builder profiles showcasing key metrics such as ETH balance, total transaction count, number of deployed tokens, linked X/Twitter accounts, and custom community tags. Each profile provides a complete overview of a builder's activity and presence on the Robinhood Chain.",
              },
              {
                step: "03",
                title: "Track Token Launches & Rewards",
                text: "Monitor real-time token launches, claim histories, reward distributions, and complete transaction activity. All data is directly sourced from verified on-chain records, giving you full transparency and reliable insights into every movement and distribution across the ecosystem.",
              },
            ].map(({ step, title, text }) => (
              <div key={step} className="relative group">
                <div className="text-6xl font-black text-[var(--accent)]/6 group-hover:text-[var(--accent)]/12 transition-colors mb-5 select-none">{step}</div>
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-[1.75]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[var(--border-subtle)] py-10 text-center" role="contentinfo">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center">
              <span className="text-black font-black text-[8px]">W</span>
            </div>
            <span className="text-sm font-bold">THE WALL</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Powered by{" "}
            <a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              Blockscout
            </a>
            {" "}· Robinhood Chain (4663)
          </p>
          <p className="text-[11px] text-[var(--text-muted)]/50 mt-2">Open-source builder analytics</p>
        </footer>
      </div>
    </div>
  );
}

/* ── Ticker Badge ── */
function TickerBadge({ dot, label, value, className = "", ariaLabel }: { dot?: boolean; label: string; value: string; className?: string; ariaLabel?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] bg-[var(--surface)] border border-[var(--border-subtle)] ${className}`}
      aria-label={ariaLabel}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] live-blink" />}
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-bold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ label, value, displayValue, sparkData, icon, delay = 0 }: { label: string; value: number; displayValue?: string; sparkData?: number[]; icon: React.ReactNode; delay?: number }) {
  return (
    <div
      className="relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-[var(--accent)]/15 hover:shadow-[0_4px_20px_rgba(0,200,5,0.04)] card-stagger group"
      style={{ animationDelay: `${delay * 60}ms` }}
      role="listitem"
      aria-label={`${label}: ${displayValue || value.toLocaleString()}`}
    >
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-3">
        <span className="text-[var(--accent)]">{icon}</span>
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        {displayValue ? (
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">{displayValue}</div>
        ) : (
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            <AnimatedCounter target={value} duration={1000} />
          </div>
        )}
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} />
        )}
      </div>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ icon, title, description, href, cta }: { icon: React.ReactNode; title: string; description: string; href: string; cta: string }) {
  return (
    <Link
      href={href}
      className="group relative bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 transition-all duration-300 hover:border-[var(--accent)]/20 hover:shadow-[0_8px_30px_rgba(0,200,5,0.06)]"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/8 flex items-center justify-center text-[var(--accent)] mb-4 group-hover:scale-110 group-hover:bg-[var(--accent)]/12 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2 group-hover:text-[var(--foreground)] transition-colors">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] group-hover:gap-2.5 transition-all duration-200">
        {cta} <ArrowRight size={14} />
      </span>
    </Link>
  );
}

