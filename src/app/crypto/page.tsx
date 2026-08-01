"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, ArrowUpRight, Activity,
  BarChart3, DollarSign, Zap, Clock, Flame, X,
  ChevronRight, Loader2, Wifi, Shield, Wallet, Globe, Lock, Layers,
  ChevronDown, ExternalLink, Info, CircleDollarSign, Coins,
  ArrowRightLeft, Repeat, Gauge,
} from "lucide-react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useAccount } from "wagmi";

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
  marketCap: number | null;
  marketState: string;
  category: "stock" | "crypto";
  sparkline: number[];
  timestamp: number;
}

interface LiveTxn {
  name: string; symbol: string; address: string; priceUsd: string;
  volume24h: number; priceChange24h: number; buys1h: number; sells1h: number;
  imageUrl: string | null; url: string; dex: string;
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
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString();
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
    const gid = `cryptoGrad-${Math.random().toString(36).slice(2, 8)}`;
    return { line, fill, gid, w, h };
  }, [data]);

  if (!svg) return null;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${svg.w} ${svg.h}`} preserveAspectRatio="none" className="flex-shrink-0" style={{ width: 72, height: 28 }}>
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

function CryptoHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-purple-500/5 border border-[var(--border)] p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Coins size={16} className="text-purple-400" />
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium uppercase tracking-wider">
            Robinhood Chain
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Trade crypto at the <span className="gradient-text">lowest cost</span> on average
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-xl">
          Buy, sell, and swap crypto on Robinhood Chain (Chain ID 4663). Access top coins, earn staking rewards, and trade with minimal fees — all from your self-custody wallet.
        </p>
        <div className="flex items-center gap-4 mt-5">
          <a
            href="https://robinhood.com/crypto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Learn more <ArrowUpRight size={14} />
          </a>
          <a
            href="https://robinhoodchain.blockscout.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-purple-500/30 transition-colors"
          >
            Block Explorer <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-purple-500/20 transition-all">
      <Icon size={20} className={`${color} mb-3`} />
      <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5">{title}</h3>
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function StakeEarnCard({ icon: Icon, title, desc, apy, color }: { icon: any; title: string; desc: string; apy?: string; color: string }) {
  return (
    <div className="bg-gradient-to-br from-[var(--surface)] to-purple-500/5 border border-[var(--border)] rounded-2xl p-6 hover:border-purple-500/20 transition-all">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} border border-white/10 flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[var(--foreground)] mb-1">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
          {apy && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
              <span className="text-[10px] text-[var(--text-muted)]">Est. APY</span>
              <span className="text-xs font-bold text-[var(--accent)]">{apy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-[var(--surface)] hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--foreground)]">{question}</span>
        <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3 text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--bg-card)] border-t border-[var(--border-subtle)] fade-in">
          {answer}
        </div>
      )}
    </div>
  );
}

const FAQ_DATA = [
  {
    q: "What crypto can I trade on Robinhood Chain?",
    a: "Robinhood Chain supports a wide range of crypto assets including BTC, ETH, SOL, DOGE, SHIB, AVAX, LTC, UNI, LINK, and many more. You can trade, swap, and transfer these assets directly from your self-custody wallet.",
  },
  {
    q: "How do staking rewards work?",
    a: "You can stake supported assets like ETH, SOL, and ADA directly through your self-custody wallet. Rewards are earned in real-time and compounded automatically. Staking starts from as little as $1 worth of crypto.",
  },
  {
    q: "What is onchain lending?",
    a: "Onchain lending lets you lend supported assets through lending protocols on Robinhood Chain. You can earn an estimated APY on your deposits, with earnings accruing in real time. All lending is managed through smart contracts.",
  },
  {
    q: "Are my crypto assets secure?",
    a: "Your crypto is held in your self-custody wallet, giving you full control over your private keys. The Robinhood Chain network is secured by validators, and smart contracts are audited by third-party security firms.",
  },
  {
    q: "What wallets are supported?",
    a: "Robinhood Chain is compatible with popular self-custody wallets including Robinhood Wallet, MetaMask, WalletConnect, Trust Wallet, and SafePal. You can connect any of these wallets to interact with the chain.",
  },
  {
    q: "Can I transfer crypto to and from Robinhood?",
    a: "Yes. You can send and receive crypto between Robinhood and your self-custody wallet. Deposits and withdrawals are processed onchain with no additional fees from the Robinhood platform.",
  },
];

const FEATURE_CARDS = [
  { icon: Coins, title: "All your favorite coins", desc: "Buy, hold, and trade popular cryptocurrencies like BTC, ETH, SOL, DOGE, SHIB, AVAX, LTC, UNI, and LINK — all on Robinhood Chain.", color: "text-purple-400" },
  { icon: ArrowRightLeft, title: "Send and receive crypto", desc: "Transfer crypto with ease between Robinhood and your self-custody wallet. No deposit or withdrawal fees.", color: "text-blue-400" },
  { icon: Repeat, title: "Recurring buys", desc: "Automate your crypto investments with recurring buys. Set it once and DCA into your favorite assets over time.", color: "text-[var(--accent)]" },
  { icon: Gauge, title: "Advanced trading tools", desc: "Custom price alerts, advanced charts, take profit and stop loss orders, and liquidation warnings to help manage risk.", color: "text-orange-400" },
];

const SECURITY_FEATURES = [
  { title: "24/7 customer support", desc: "Round-the-clock support for all your crypto needs." },
  { title: "Industry-leading security", desc: "Your assets are protected by industry-standard security measures." },
  { title: "Self-custody", desc: "Full control over your private keys and assets at all times." },
  { title: "Audited smart contracts", desc: "All contracts are audited by third-party security firms." },
];

export default function CryptoPage() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [liveTxns, setLiveTxns] = useState<LiveTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);

  const { address, isConnected } = useAccount();

  const fetchData = useCallback(async () => {
    try {
      const [qRes, txnRes] = await Promise.allSettled([
        fetch("/api/market?action=quotes&category=crypto"),
        fetch("/api/live-activity"),
      ]);
      if (qRes.status === "fulfilled") {
        const data = await qRes.value.json();
        if (data.quotes) {
          const cryptoQ = data.quotes.filter((q: MarketQuote) => q.category === "crypto");
          setQuotes(cryptoQ);
        }
      }
      if (txnRes.status === "fulfilled") {
        const data = await txnRes.value.json();
        if (data.recentActivity) setLiveTxns(data.recentActivity.slice(0, 10));
      }
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const cryptoQuotes = useMemo(() => {
    return quotes.filter((q) => q.category === "crypto").slice(0, 8);
  }, [quotes]);

  return (
    <div className="space-y-8 fade-in">

      {/* Hero */}
      <CryptoHero />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
            <Coins size={12} className="text-purple-400" />
            <span className="text-[10px] uppercase tracking-wider">Crypto Assets</span>
          </div>
          <div className="text-xl font-bold gradient-text">{cryptoQuotes.length || "—"}</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-[10px] uppercase tracking-wider">Gainers</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            {quotes.filter((q) => q.category === "crypto" && q.changePercent > 0).length}
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
            <TrendingDown size={12} className="text-red-400" />
            <span className="text-[10px] uppercase tracking-wider">Losers</span>
          </div>
          <div className="text-xl font-bold text-red-400">
            {quotes.filter((q) => q.category === "crypto" && q.changePercent < 0).length}
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
            <Activity size={12} className="text-[var(--accent)]" />
            <span className="text-[10px] uppercase tracking-wider">DEX Activity</span>
          </div>
          <div className="text-sm font-bold text-[var(--foreground)]">{liveTxns.length > 0 ? `${liveTxns.length} pairs` : "—"}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <Wifi size={12} className={autoRefresh ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
          <span>{autoRefresh ? "Live" : "Paused"}</span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectWalletButton compact />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              autoRefresh ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </button>
          <button
            onClick={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
            disabled={refreshing}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Top Crypto Prices */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-purple-400" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Top Crypto Prices</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        ) : cryptoQuotes.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
            <Coins size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">No crypto price data available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cryptoQuotes.map((q) => {
              const positive = q.changePercent >= 0;
              return (
                <button
                  key={q.symbol}
                  onClick={() => setDetailSymbol(q.symbol)}
                  className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)] transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--foreground)] truncate">{q.symbol}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate">{q.name}</div>
                    </div>
                    <MiniSparkline data={q.sparkline} positive={positive} />
                  </div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-base font-bold text-[var(--foreground)]">{formatPrice(q.price)}</span>
                    <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${positive ? "text-green-400" : "text-red-400"}`}>
                      {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {positive ? "+" : ""}{q.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                    <span>Vol {formatVolume(q.volume)}</span>
                    <span>MCap {q.marketCap ? `$${(q.marketCap / 1e9).toFixed(2)}B` : "—"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Put your crypto to work */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Put your crypto to work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StakeEarnCard
            icon={Zap}
            title="Stake and earn rewards"
            desc="Earn staking rewards on your ETH, SOL and ADA for as little as $1 of crypto. Rewards are compounded automatically."
            apy="~7%"
            color="from-[var(--accent)]/30 to-[var(--accent)]/5"
          />
          <StakeEarnCard
            icon={DollarSign}
            title="Earn an estimated 7% APY"
            desc="Lend supported assets onchain through a self-custody wallet and accrue earnings in real time via lending protocols."
            apy="~7%"
            color="from-purple-500/30 to-purple-500/5"
          />
        </div>
      </div>

      {/* Your complete toolkit */}
      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Your complete toolkit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* DEX Activity Feed */}
      {liveTxns.length > 0 && (
        <div className="bg-gradient-to-br from-[var(--surface)] to-purple-500/5 border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-purple-400" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Live DEX Activity</h2>
            <span className="ml-auto text-[9px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
              Live
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] px-3 pb-1.5 border-b border-[var(--border)]">
              <span className="flex-[2]">Token</span>
              <span className="flex-1 text-right">Price</span>
              <span className="flex-1 text-right">Change</span>
              <span className="flex-1 text-right">Buys</span>
              <span className="flex-1 text-right">Sells</span>
            </div>
            {liveTxns.map((tx, i) => {
              const positive = tx.priceChange24h >= 0;
              return (
                <a
                  key={`${tx.address}-${i}`}
                  href={tx.url || `https://dexscreener.com/robinhood/${tx.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-[2] min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-[7px] font-bold text-purple-400 shrink-0">
                      {tx.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{tx.symbol}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate">{tx.name}</div>
                    </div>
                  </div>
                  <div className="flex-1 text-right text-[10px] font-mono font-medium">
                    ${Number(tx.priceUsd) < 0.01 ? Number(tx.priceUsd).toExponential(2) : Number(tx.priceUsd).toFixed(4)}
                  </div>
                  <div className={`flex-1 text-right text-[10px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                    {positive ? "+" : ""}{tx.priceChange24h.toFixed(1)}%
                  </div>
                  <div className="flex-1 text-right text-[10px] text-green-400 font-medium">{tx.buys1h}</div>
                  <div className="flex-1 text-right text-[10px] text-red-400 font-medium">{tx.sells1h}</div>
                </a>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-[var(--text-muted)]">Data from DexScreener</span>
            <a
              href="https://dexscreener.com/robinhood"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:underline"
            >
              View all on DexScreener <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Protection */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Protection for your coins. Peace of mind for you.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECURITY_FEATURES.map((f) => (
            <div key={f.title} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <div className="text-sm font-bold text-[var(--foreground)] mb-1.5">{f.title}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-purple-400" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Connect your wallet</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-5 max-w-lg">
          Connect your self-custody wallet to trade crypto, stake assets, and interact with dApps on Robinhood Chain.
        </p>
        {!isConnected ? (
          <div className="flex flex-col items-center py-8 border border-dashed border-[var(--border)] rounded-xl">
            <Wallet size={32} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">Connect your wallet to get started</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">Link MetaMask, WalletConnect, or Robinhood Wallet</p>
            <ConnectWalletButton />
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="w-3 h-3 rounded-full bg-green-400 live-blink" />
            <div className="text-sm font-medium text-[var(--foreground)]">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-purple-400" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {FAQ_DATA.map((faq) => (
            <FaqAccordion key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {detailSymbol && (
        <CryptoDetailModal symbol={detailSymbol} onClose={() => setDetailSymbol(null)} />
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-[var(--text-muted)] py-4 border-t border-[var(--border-subtle)]">
        <p>Live data from Financial Modeling Prep & DexScreener · Prices may be delayed</p>
        <p className="mt-1">Robinhood Chain ID 4663 · Block Explorer: robinhoodchain.blockscout.com</p>
      </div>
    </div>
  );
}

function CryptoDetailModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
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
            <Loader2 size={20} className="animate-spin text-purple-400" />
          </div>
        )}

        {quote && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--foreground)]">{quote.symbol}</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  CRYPTO
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
              </div>
              <div className="text-sm text-[var(--text-muted)]">{quote.name}</div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
              <div className={`flex items-center gap-1 text-lg font-semibold ${quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {quote.changePercent >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Previous Close", value: formatPrice(quote.previousClose), color: "" },
                { label: "Open", value: formatPrice(quote.open), color: "" },
                { label: "Day High", value: formatPrice(quote.dayHigh), color: "text-green-400" },
                { label: "Day Low", value: formatPrice(quote.dayLow), color: "text-red-400" },
                { label: "Volume", value: formatVolume(quote.volume), color: "" },
                { label: "Market Cap", value: quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : "—", color: "" },
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
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:underline"
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
