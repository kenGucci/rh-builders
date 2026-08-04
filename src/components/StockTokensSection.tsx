"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, CircleDollarSign, Shield, Globe, Lock, Layers,
  ChevronDown, ExternalLink, ChevronRight, ArrowUpRight, Building2,
} from "lucide-react";

const StockChart = dynamic(() => import("@/components/StockChart"), { ssr: false });
const TradeModal = dynamic(() => import("@/components/TradeModal"), { ssr: false });
import StockLogo from "@/components/StockLogo";

interface CompanyProfile {
  symbol: string;
  industry: string;
  founded: string;
  headquarters: string;
  website: string;
  description: string;
}

interface StockToken {
  symbol: string;
  name: string;
  sector: string;
  chain: string;
  multiplier: number;
  backed: boolean;
  custodian: string;
  tokenAddress: string;
  apy: number;
  tvl: number;
  logo?: string;
  profile: CompanyProfile | null;
}

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
  sparkline: number[];
  marketState: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockTrade {
  symbol: string;
  name: string;
  side: "buy" | "sell";
  fromShort: string;
  toShort: string;
  amountFormatted: string;
  timestamp: string;
  txHash: string;
}

function formatPrice(p: number): string {
  if (p >= 10000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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

function formatMarketCap(cap: number | null): string {
  if (!cap) return "—";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

export default function StockTokensSection({ limit }: { limit?: number }) {
  const [tokens, setTokens] = useState<StockToken[]>([]);
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [charts, setCharts] = useState<Record<string, Candle[]>>({});
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeToken, setTradeToken] = useState<StockToken | null>(null);
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/stock-tokens");
      const data = await res.json();
      if (!data.tokens) return;
      const all = data.tokens as StockToken[];
      setTokens(all);
      const visibleTokens = limit ? all.slice(0, limit) : all;
      const symbols = visibleTokens.map((t) => t.symbol).join(",");
      const [qRes, cRes] = await Promise.all([
        fetch(`/api/market?action=batch&symbols=${symbols}`),
        fetch(`/api/market?action=charts&symbols=${symbols}&range=1mo`),
      ]);
      const qData = await qRes.json();
      if (qData.quotes) {
        const map: Record<string, MarketQuote> = {};
        for (const q of qData.quotes) map[q.symbol] = q;
        setQuotes(map);
      }
      const cData = await cRes.json();
      if (cData.charts) {
        const map: Record<string, Candle[]> = {};
        for (const [sym, ch] of Object.entries(cData.charts)) {
          const chart = ch as { candles?: Candle[] };
          if (chart?.candles) map[sym] = chart.candles;
        }
        setCharts(map);
      }
    } catch {}
  }, [limit]);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/stock-trades?limit=12");
      const data = await res.json();
      if (data.trades) setTrades(data.trades);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const visible = useMemo(() => (limit ? tokens.slice(0, limit) : tokens), [tokens, limit]);

  return (
    <section className="scroll-reveal" aria-label="Invest with Stock Tokens">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--accent)] mb-2">
            <CircleDollarSign size={12} />
            Invest with Stock Tokens
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trade real stocks on-chain</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">
            {tokens.length > 0 ? tokens.length : "90+"} Stock Tokens linked to companies and ETFs including NVIDIA, Apple, Google, and Invesco QQQ — live prices, real charts, real on-chain buys and sells.
          </p>
        </div>
        <a
          href="/market"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Full market <ArrowUpRight size={14} />
        </a>
      </div>

      <LiveTradesFeed trades={trades} />

      {loading && tokens.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((token) => (
            <StockTokenCard
              key={token.symbol}
              token={token}
              quote={quotes[token.symbol]}
              chartData={charts[token.symbol]}
              onTrade={(mode) => { setTradeToken(token); setTradeMode(mode); }}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <a href="/market" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline sm:hidden">
          Full market <ArrowUpRight size={14} />
        </a>
      </div>

      {tradeToken && (
        <TradeModal
          token={tradeToken}
          quote={quotes[tradeToken.symbol]}
          initialMode={tradeMode}
          onClose={() => setTradeToken(null)}
        />
      )}
    </section>
  );
}

function LiveTradesFeed({ trades }: { trades: StockTrade[] }) {
  if (trades.length === 0) return null;
  const fmtTime = (t: string) => {
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return (
    <div className="mb-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/40">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
        <span className="text-[11px] font-semibold text-[var(--foreground)]">Live Stock Token Trades</span>
        <span className="text-[9px] text-[var(--text-muted)]">real on-chain buys &amp; sells · Robinhood Chain</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border-subtle)]/40">
        {trades.map((t, i) => (
          <a
            key={`${t.txHash}-${i}`}
            href={`https://robinhoodchain.blockscout.com/tx/${t.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <span className={`shrink-0 w-14 text-center text-[9px] font-bold rounded-md py-0.5 ${t.side === "buy" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {t.side === "buy" ? "BUY" : "SELL"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-[var(--foreground)]">{t.symbol}</div>
              <div className="text-[9px] text-[var(--text-muted)] truncate">{t.fromShort} → {t.toShort}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-semibold text-[var(--foreground)]">{t.amountFormatted}</div>
              <div className="text-[9px] text-[var(--text-muted)]">{fmtTime(t.timestamp)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function StockTokenCard({ token, quote, chartData, onTrade }: { token: StockToken; quote?: MarketQuote; chartData?: Candle[]; onTrade: (mode: "buy" | "sell") => void }) {
  const [expanded, setExpanded] = useState(false);
  const positive = quote ? quote.changePercent >= 0 : true;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--accent)]/25 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,200,5,0.06)] flex flex-col">
      <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
          <StockLogo symbol={token.symbol} logo={token.logo} size={40} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--foreground)]">{token.symbol}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
                STOCK TOKEN
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">{token.name}</div>
          </div>
        </div>
        {quote && (
          <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />
        )}
      </div>

      {quote && (
        <div className="flex items-end gap-2 mb-3">
          <span className="text-xl font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-[10px]">
          <Shield size={10} className="text-green-400" />
          <span className="text-[var(--text-muted)]">1:1 Backed</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Globe size={10} className="text-blue-400" />
          <span className="text-[var(--text-muted)]">Robinhood Chain</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Lock size={10} className="text-purple-400" />
          <span className="text-[var(--text-muted)]">{token.custodian}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Layers size={10} className="text-orange-400" />
          <span className="text-[var(--text-muted)]">{token.sector}</span>
        </div>
      </div>

      <div className="mb-3">
        <StockChart symbol={token.symbol} height={140} defaultRange="1mo" initialData={chartData} live />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <span>Company &amp; Token Details</span>
        <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 fade-in">
          {token.profile && (
            <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent)]">
                <Building2 size={10} />
                Company Profile
              </div>
              <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">{token.profile.description}</p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <div className="text-[9px] text-[var(--text-muted)]">Industry: <span className="text-[var(--foreground)]">{token.profile.industry}</span></div>
                <div className="text-[9px] text-[var(--text-muted)]">Founded: <span className="text-[var(--foreground)]">{token.profile.founded}</span></div>
                <div className="text-[9px] text-[var(--text-muted)]">HQ: <span className="text-[var(--foreground)]">{token.profile.headquarters}</span></div>
                <div className="text-[9px] text-[var(--text-muted)]">
                  <a href={token.profile.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline flex items-center gap-1">
                    {token.profile.website.replace("https://www.", "").replace("https://", "")} <ExternalLink size={8} />
                  </a>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">Multiplier</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.multiplier}x</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">Chain</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">4663</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">TVL</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{formatMarketCap(token.tvl)}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">APY</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.apy > 0 ? `${token.apy}%` : "—"}</span>
            </div>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)]">Contract</span>
            <a
              href={`https://robinhoodchain.blockscout.com/token/${token.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
              <ExternalLink size={8} />
            </a>
          </div>
        </div>
      )}

      {quote && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">High</span>
            <span className="text-green-400">{formatPrice(quote.dayHigh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Low</span>
            <span className="text-red-400">{formatPrice(quote.dayLow)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Vol</span>
            <span className="text-[var(--text-secondary)]">{formatVolume(quote.volume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">MCap</span>
            <span className="text-[var(--text-secondary)]">{formatMarketCap(quote.marketCap)}</span>
          </div>
        </div>
      )}

      {/* View live profile */}
      <Link
        href={`/stock/${token.symbol}`}
        className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
      >
        <ExternalLink size={11} /> View Live Profile
      </Link>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)] mt-auto">
        <button
          onClick={() => onTrade("buy")}
          className="py-2.5 rounded-xl bg-green-500 text-black text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Buy {token.symbol}
        </button>
        <button
          onClick={() => onTrade("sell")}
          className="py-2.5 rounded-xl bg-red-500 text-black text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Sell {token.symbol}
        </button>
      </div>
    </div>
  );
}
