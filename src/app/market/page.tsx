"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, ArrowUpRight, Activity,
  BarChart3, DollarSign, Zap, Clock, Flame, X,
  ChevronRight, Loader2, Wifi, Shield, Wallet, Globe, Lock, Layers,
  ChevronDown, ExternalLink, Info, CircleDollarSign, ArrowUpDown,
} from "lucide-react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import SwapPanel from "@/components/SwapPanel";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import type { EcosystemApp } from "@/app/api/ecosystem/route";

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
  avgVolume: number | null;
  marketCap: number | null;
  pe: number | null;
  week52High: number;
  week52Low: number;
  marketState: string;
  currency: string;
  category: "stock" | "crypto";
  exchange: string;
  timestamp: number;
  sparkline: number[];
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface LiveTxn {
  name: string; symbol: string; address: string; priceUsd: string;
  volume24h: number; priceChange24h: number; buys1h: number; sells1h: number;
  imageUrl: string | null; url: string; dex: string;
}

interface MarketSummary {
  totalAssets: number;
  gainers: number;
  losers: number;
  unchanged: number;
  topGainer: { symbol: string; name: string; changePercent: number; price: number } | null;
  topLoser: { symbol: string; name: string; changePercent: number; price: number } | null;
  lastUpdated: string;
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
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
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
    const gid = `mktGrad-${Math.random().toString(36).slice(2, 8)}`;
    return { line, fill, gid, w, h };
  }, [data]);

  if (!svg) return null;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <svg viewBox={`0 0 ${svg.w} ${svg.h}`} preserveAspectRatio="none" className="flex-shrink-0" style={{ width: 80, height: 32 }}>
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

function StockTokenCard({ token, quote }: { token: StockToken; quote?: MarketQuote }) {
  const [expanded, setExpanded] = useState(false);
  const positive = quote ? quote.changePercent >= 0 : true;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-[0_0_30px_var(--accent-glow)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--accent)]">{token.symbol}</span>
          </div>
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
          <MiniSparkline data={quote.sparkline} positive={positive} />
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

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <span>Token Details</span>
        <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">Multiplier</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.multiplier}x</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">Backed</span>
              <span className="text-xs font-semibold text-green-400">Yes</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">Chain</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">4663</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)]">TVL</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{formatMarketCap(token.tvl)}</span>
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
    </div>
  );
}

function QuoteCard({ quote, onClick }: { quote: MarketQuote; onClick?: () => void }) {
  const positive = quote.changePercent >= 0;
  const stateLabel = quote.marketState === "REGULAR" ? "Open"
    : quote.marketState === "PRE" ? "Pre"
    : quote.marketState === "POST" ? "After"
    : quote.marketState === "CLOSED" ? "Closed"
    : quote.marketState;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent)]/30 transition-all duration-300 hover:shadow-[0_0_30px_var(--accent-glow)] w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-[var(--foreground)] truncate">{quote.symbol}</span>
            <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${
              quote.category === "crypto"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {quote.category === "crypto" ? "CRYPTO" : "STOCK"}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{quote.name}</div>
        </div>
        <MiniSparkline data={quote.sparkline} positive={positive} />
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-lg font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
        <div className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Open</span>
          <span className="text-[var(--text-secondary)]">{formatPrice(quote.open)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Prev</span>
          <span className="text-[var(--text-secondary)]">{formatPrice(quote.previousClose)}</span>
        </div>
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

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
          quote.marketState === "REGULAR" ? "bg-green-500/10 text-green-400" :
          quote.marketState === "PRE" ? "bg-yellow-500/10 text-yellow-400" :
          quote.marketState === "POST" ? "bg-orange-500/10 text-orange-400" :
          "bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}>
          {stateLabel}
        </span>
        <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
      </div>
    </button>
  );
}

function MoverRow({ quote, rank }: { quote: MarketQuote; rank: number }) {
  const positive = quote.changePercent >= 0;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
      <span className="text-[10px] font-bold text-[var(--text-muted)] w-4 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[var(--foreground)] truncate">{quote.symbol}</span>
          <span className={`text-[7px] px-1 py-0.5 rounded font-medium ${
            quote.category === "crypto" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
          }`}>
            {quote.category === "crypto" ? "C" : "S"}
          </span>
        </div>
        <div className="text-[9px] text-[var(--text-muted)] truncate">{quote.name}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</div>
        <div className={`flex items-center gap-0.5 justify-end text-[10px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function DetailModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
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

  useEffect(() => {
    if (!quote) return;
    const interval = setInterval(() => {
      fetch(`/api/market?action=quote&symbol=${symbol}`)
        .then((r) => r.json())
        .then((data) => { if (data.quote) setQuote(data.quote); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [symbol, quote]);

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
            <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          </div>
        )}

        {quote && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--foreground)]">{quote.symbol}</h2>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  quote.category === "crypto"
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}>
                  {quote.category === "crypto" ? "CRYPTO" : "STOCK"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
              </div>
              <div className="text-sm text-[var(--text-muted)]">{quote.name}</div>
              {quote.exchange && <div className="text-[10px] text-[var(--text-muted)]">{quote.exchange}</div>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--foreground)]">{formatPrice(quote.price)}</span>
              <div className={`flex items-center gap-1 text-lg font-semibold ${quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {quote.changePercent >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            {quote.sparkline && quote.sparkline.length > 1 && (
              <div className="rounded-xl bg-[var(--bg-card)] p-3 border border-[var(--border-subtle)]">
                <MiniSparkline data={quote.sparkline} positive={quote.changePercent >= 0} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Previous Close", value: formatPrice(quote.previousClose), color: "" },
                { label: "Open", value: formatPrice(quote.open), color: "" },
                { label: "Day High", value: formatPrice(quote.dayHigh), color: "text-green-400" },
                { label: "Day Low", value: formatPrice(quote.dayLow), color: "text-red-400" },
                { label: "Volume", value: formatVolume(quote.volume), color: "" },
                { label: "Avg Volume", value: quote.avgVolume ? formatVolume(quote.avgVolume) : "—", color: "" },
                { label: "Market Cap", value: formatMarketCap(quote.marketCap), color: "" },
                { label: "P/E Ratio", value: quote.pe ? quote.pe.toFixed(2) : "—", color: "" },
                { label: "52W High", value: formatPrice(quote.week52High), color: "text-green-400" },
                { label: "52W Low", value: formatPrice(quote.week52Low), color: "text-red-400" },
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
                className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
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
    q: "What are Stock Tokens?",
    a: "Stock Tokens are tokenized debt securities issued by Robinhood Assets (Jersey) Limited. They provide economic exposure to underlying securities like NVIDIA, Apple, and Google — all on Robinhood Chain (Chain ID 4663).",
  },
  {
    q: "How do Stock Tokens work?",
    a: "Each Stock Token is backed 1:1 by the corresponding underlying equity. The shares are held by a licensed US-based custodian. Your token's multiplier increases when dividends are paid — meaning your token represents more shares over time.",
  },
  {
    q: "Can I receive dividends?",
    a: "Instead of cash dividends, a multiplier mechanism is used. When an underlying company pays a dividend, it is automatically reinvested to purchase more shares. Your token's multiplier increases, meaning it dynamically represents more than one share of stock over time.",
  },
  {
    q: "Can I redeem my Stock Tokens?",
    a: "Yes. You can sell your Stock Tokens in the secondary market or redeem them directly with the Issuer, subject to completing KYC/AML identity verification processes.",
  },
  {
    q: "What wallets are supported?",
    a: "Stock Tokens are compatible with popular self-custody wallets including Robinhood Wallet, Trust Wallet, SafePal, and more. Trade and manage your tokens from the wallet you already use.",
  },
  {
    q: "Are my assets protected?",
    a: "Yes. Stock Tokens are fully collateralized with their underlying assets, which are monitored daily. In the unlikely event of issuer insolvency, an independent security agent will sell the underlying shares and distribute cash proceeds to token holders.",
  },
];

const WALLET_LIST = [
  { name: "Robinhood Wallet", desc: "Native wallet for Robinhood Chain", color: "from-green-500/20 to-green-500/5" },
  { name: "Trust Wallet", desc: "Multi-chain self-custody wallet", color: "from-blue-500/20 to-blue-500/5" },
  { name: "SafePal", desc: "Hardware + software wallet", color: "from-purple-500/20 to-purple-500/5" },
  { name: "MetaMask", desc: "Popular browser extension wallet", color: "from-orange-500/20 to-orange-500/5" },
];

const FEATURE_CARDS = [
  { icon: Globe, title: "Markets beyond borders, 24/7", desc: "Get exposure to US markets. Invest in Stock Tokens linked to popular US stocks and ETFs — available around the clock.", color: "text-blue-400" },
  { icon: Shield, title: "Shares behind every token", desc: "Every Stock Token is backed 1:1 by the underlying stock. Held by a licensed custodian and monitored daily.", color: "text-green-400" },
  { icon: Zap, title: "Unlock more opportunities", desc: "Put your Stock Tokens to work. Deploy them onchain to earn yield, use as collateral to borrow, and more.", color: "text-yellow-400" },
  { icon: Lock, title: "Built-in protection", desc: "Stock Tokens are fully collateralized with their underlying assets. In case of insolvency, assets are protected by an independent security agent.", color: "text-purple-400" },
];

export default function MarketPage() {
  const [stockTokens, setStockTokens] = useState<StockToken[]>([]);
  const [tokenQuotes, setTokenQuotes] = useState<Record<string, MarketQuote>>({});
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [gainers, setGainers] = useState<MarketQuote[]>([]);
  const [losers, setLosers] = useState<MarketQuote[]>([]);
  const [movers, setMovers] = useState<MarketQuote[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<"all" | "stock" | "crypto">("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "txns" | "tokens" | "watchlist" | "gainers" | "losers" | "movers">("board");
  const [liveTxns, setLiveTxns] = useState<LiveTxn[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [ecosystemApps, setEcosystemApps] = useState<EcosystemApp[]>([]);
  const [ecosystemLoading, setEcosystemLoading] = useState(true);
  const [ecosystemCategory, setEcosystemCategory] = useState("All");
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [walletTokens, setWalletTokens] = useState<{ symbol: string; balance: string }[]>([]);

  const fetchStockTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock-tokens?sector=${sectorFilter}`);
      const data = await res.json();
      if (data.tokens) {
        setStockTokens(data.tokens);
        const symbols = data.tokens.map((t: StockToken) => t.symbol).join(",");
        const qRes = await fetch(`/api/market?action=batch&symbols=${symbols}`);
        const qData = await qRes.json();
        if (qData.quotes) {
          const map: Record<string, MarketQuote> = {};
          for (const q of qData.quotes) map[q.symbol] = q;
          setTokenQuotes(map);
        }
      }
    } catch {}
  }, [sectorFilter]);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`/api/market?action=quotes&category=${filter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.quotes) setQuotes(data.quotes);
      if (data.summary) setSummary(data.summary);
    } catch {}
  }, [filter]);

  const fetchMovers = useCallback(async () => {
    try {
      const [glRes, mvRes] = await Promise.allSettled([
        fetch("/api/market?action=gainers-losers"),
        fetch("/api/market?action=movers"),
      ]);
      if (glRes.status === "fulfilled") {
        const data = await glRes.value.json();
        if (data.gainers) setGainers(data.gainers);
        if (data.losers) setLosers(data.losers);
      }
      if (mvRes.status === "fulfilled") {
        const data = await mvRes.value.json();
        if (data.movers) setMovers(data.movers);
      }
    } catch {}
  }, []);

  const fetchTxns = useCallback(async () => {
    setTxnsLoading(true);
    try {
      const res = await fetch("/api/live-activity");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.recentActivity) setLiveTxns(data.recentActivity.slice(0, 20));
    } catch {} finally { setTxnsLoading(false); }
  }, []);

  const fetchEcosystem = useCallback(async () => {
    try {
      const res = await fetch("/api/ecosystem");
      const data = await res.json();
      if (data.apps) setEcosystemApps(data.apps);
    } catch {} finally { setEcosystemLoading(false); }
  }, []);

  const fetchWalletTokens = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/address-tokens?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tokens) setWalletTokens(data.tokens);
      }
    } catch {}
  }, [address]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchStockTokens(), fetchWatchlist(), fetchMovers(), fetchTxns(), fetchEcosystem(), fetchWalletTokens()]);
  }, [fetchStockTokens, fetchWatchlist, fetchMovers, fetchTxns, fetchEcosystem, fetchWalletTokens]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { fetchAll(); }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAll]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/market?action=search&query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearch(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const selectSearchResult = (result: SearchResult) => {
    setDetailSymbol(result.symbol);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      if (filter === "stock") return q.category === "stock";
      if (filter === "crypto") return q.category === "crypto";
      return true;
    });
  }, [quotes, filter]);

  const sectors = useMemo(() => {
    const s = new Set(stockTokens.map((t) => t.sector));
    return ["all", ...Array.from(s)];
  }, [stockTokens]);

  const tabs = [
    { id: "board" as const, label: "Live Board", icon: BarChart3, count: 0, color: "text-[var(--accent)]" },
    { id: "txns" as const, label: "Transactions", icon: Activity, count: liveTxns.length, color: "text-blue-400" },
    { id: "tokens" as const, label: "Stock Tokens", icon: CircleDollarSign, count: stockTokens.length, color: "text-[var(--accent)]" },
    { id: "watchlist" as const, label: "Watchlist", icon: Activity, count: filteredQuotes.length },
    { id: "gainers" as const, label: "Gainers", icon: TrendingUp, count: gainers.length, color: "text-green-400" },
    { id: "losers" as const, label: "Losers", icon: TrendingDown, count: losers.length, color: "text-red-400" },
    { id: "movers" as const, label: "Top Movers", icon: Flame, count: movers.length, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-8 fade-in">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--accent)]/5 border border-[var(--border)] p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <CircleDollarSign size={16} className="text-[var(--accent)]" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium uppercase tracking-wider">
              Robinhood Chain
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Invest with <span className="gradient-text">Stock Tokens</span></h1>
          <p className="text-sm text-[var(--text-muted)] max-w-xl">
            Trade and own 90+ Stock Tokens linked to companies and ETFs including NVIDIA, Google, Apple, and Invesco QQQ — all from your wallet on Robinhood Chain.
          </p>
          <div className="flex items-center gap-4 mt-5">
            <a
              href="https://robinhood.com/rhj/stocktokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Learn more <ArrowUpRight size={14} />
            </a>
            <a
              href="https://robinhood.com/chain/ecosystem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors"
            >
              Explore apps <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURE_CARDS.map((card) => (
          <div key={card.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/20 transition-all">
            <card.icon size={20} className={`${card.color} mb-3`} />
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5">{card.title}</h3>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Search + Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="Search any stock or crypto symbol..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 focus:shadow-[0_0_20px_var(--accent-glow)] transition-all"
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--accent)]" />}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => selectSearchResult(result)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-[var(--accent)]">{result.symbol.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--foreground)]">{result.symbol}</span>
                      <span className={`text-[7px] px-1 py-0.5 rounded font-medium ${
                        isCryptoSymbol(result.symbol) ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {isCryptoSymbol(result.symbol) ? "CRYPTO" : "STOCK"}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{result.name}</div>
                  </div>
                  <ArrowUpRight size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
          {showSearch && searchQuery && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-4 text-center">
              <span className="text-xs text-[var(--text-muted)]">No results found</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConnectWalletButton compact />
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <Wifi size={12} className={autoRefresh ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
            <span>{autoRefresh ? "Live" : "Paused"}</span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              autoRefresh ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </button>
          <button
            onClick={async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); }}
            disabled={refreshing}
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <BarChart3 size={12} className="text-[var(--accent)]" />
              <span className="text-[10px] uppercase tracking-wider">Assets</span>
            </div>
            <div className="text-xl font-bold gradient-text">{summary.totalAssets}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-[10px] uppercase tracking-wider">Gainers</span>
            </div>
            <div className="text-xl font-bold text-green-400">{summary.gainers}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <TrendingDown size={12} className="text-red-400" />
              <span className="text-[10px] uppercase tracking-wider">Losers</span>
            </div>
            <div className="text-xl font-bold text-red-400">{summary.losers}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-1.5">
              <Zap size={12} className="text-[var(--accent)]" />
              <span className="text-[10px] uppercase tracking-wider">Top Mover</span>
            </div>
            <div className="text-sm font-bold text-[var(--foreground)]">{summary.topGainer?.symbol || "—"}</div>
            <div className="text-[10px] text-green-400">{summary.topGainer ? `+${summary.topGainer.changePercent.toFixed(2)}%` : ""}</div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon size={12} className={tab.color || ""} />
            {tab.label}
            <span className="text-[9px] px-1 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Live Board */}
      {activeTab === "board" && !loading && (
        <LiveBoard quotes={quotes} onSelect={setDetailSymbol} />
      )}

      {/* Transactions Feed */}
      {activeTab === "txns" && (
        <TxnsFeed txns={liveTxns} loading={txnsLoading} />
      )}

      {/* Stock Tokens Filter */}
      {activeTab === "tokens" && (
        <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                sectorFilter === s ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s === "all" ? "All Sectors" : s}
            </button>
          ))}
        </div>
      )}

      {/* Watchlist Filter */}
      {activeTab === "watchlist" && (
        <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
          {(["all", "stock", "crypto"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-[var(--accent)] text-black shadow-[0_0_12px_var(--accent-glow)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))}
        </div>
      )}

      {/* Stock Tokens Grid */}
      {!loading && activeTab === "tokens" && (
        <>
          {stockTokens.length === 0 ? (
            <div className="text-center py-16">
              <CircleDollarSign size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No stock tokens available.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockTokens.map((token) => (
                <StockTokenCard key={token.symbol} token={token} quote={tokenQuotes[token.symbol]} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Watchlist Grid */}
      {!loading && activeTab === "watchlist" && (
        <>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-16">
              <Activity size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No assets found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotes.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} onClick={() => setDetailSymbol(quote.symbol)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Gainers */}
      {!loading && activeTab === "gainers" && (
        <div className="space-y-1">
          {gainers.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No gainers data available.</div>
            </div>
          ) : (
            gainers.map((q, i) => (
              <div key={q.symbol} onClick={() => setDetailSymbol(q.symbol)} className="cursor-pointer">
                <MoverRow quote={q} rank={i + 1} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Losers */}
      {!loading && activeTab === "losers" && (
        <div className="space-y-1">
          {losers.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No losers data available.</div>
            </div>
          ) : (
            losers.map((q, i) => (
              <div key={q.symbol} onClick={() => setDetailSymbol(q.symbol)} className="cursor-pointer">
                <MoverRow quote={q} rank={i + 1} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Top Movers */}
      {!loading && activeTab === "movers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {movers.length === 0 ? (
            <div className="text-center py-16 col-span-full">
              <Flame size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <div className="text-sm text-[var(--text-muted)]">No movers data available.</div>
            </div>
          ) : (
            movers.map((quote) => (
              <QuoteCard key={quote.symbol} quote={quote} onClick={() => setDetailSymbol(quote.symbol)} />
            ))
          )}
        </div>
      )}

      {/* Wallet Connection + Trading */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Trade on wallets you trust</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-5 max-w-lg">
          Stock Tokens are compatible with popular self-custody wallets. Connect your wallet to trade, check balances, and swap tokens directly on Robinhood Chain.
        </p>

        {!isConnected ? (
          <div className="flex flex-col items-center py-8 border border-dashed border-[var(--border)] rounded-xl">
            <Wallet size={32} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">Connect your wallet to start trading</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">Link MetaMask, WalletConnect, or Coinbase Wallet</p>
            <ConnectWalletButton />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 w-full max-w-2xl">
              {WALLET_LIST.map((w) => (
                <div key={w.name} className={`bg-gradient-to-br ${w.color} border border-[var(--border)] rounded-xl p-3 text-center`}>
                  <div className="text-sm font-bold text-[var(--foreground)] mb-0.5">{w.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Wallet Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1">Connected</div>
                  <div className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1">ETH Balance</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    {ethBalance ? `${Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH` : "—"}
                  </div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1">Chain</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">Robinhood Chain</div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="text-[10px] text-[var(--text-muted)] mb-1">Tokens</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">{walletTokens.length > 0 ? walletTokens.length : "—"}</div>
                </div>
              </div>

              {walletTokens.length > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="text-[10px] text-[var(--text-muted)] mb-2 uppercase tracking-wider">Your Token Balances</div>
                  <div className="space-y-1">
                    {walletTokens.map((t, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors">
                        <span className="text-xs font-medium text-[var(--foreground)]">{t.symbol}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{t.balance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Real Swap Panel */}
            <SwapPanel tokens={stockTokens} />
          </div>
        )}
      </div>

      {/* Ecosystem — Real Data */}
      <div className="bg-gradient-to-br from-[var(--surface)] to-[var(--accent)]/5 border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">See what&apos;s onchain</h2>
          {!ecosystemLoading && ecosystemApps.length > 0 && (
            <span className="ml-auto text-[9px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
              {ecosystemApps.length} apps
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4 max-w-lg">
          New apps are always launching on Robinhood Chain. Explore apps for trading, lending, borrowing, and more.
        </p>

        {/* Category Filter */}
        {!ecosystemLoading && ecosystemApps.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-4">
            {["All", ...Array.from(new Set(ecosystemApps.flatMap((a) => a.categories)))].map((cat) => (
              <button
                key={cat}
                onClick={() => setEcosystemCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  ecosystemCategory === cat
                    ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Apps Grid */}
        {ecosystemLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        ) : ecosystemApps.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ecosystemApps
                .filter((app) => ecosystemCategory === "All" || app.categories.includes(ecosystemCategory))
                .map((app) => (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/20 transition-all text-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-2.5 overflow-hidden">
                      <EcosystemLogo logo={app.logo} name={app.name} />
                    </div>
                    <div className="text-xs font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {app.name}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                      {app.description}
                    </div>
                    {app.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {app.categories.slice(0, 2).map((cat) => (
                          <span key={cat} className="text-[7px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-[var(--text-muted)]">
                Showing {ecosystemApps.filter((a) => ecosystemCategory === "All" || a.categories.includes(ecosystemCategory)).length} of {ecosystemApps.length} apps
              </span>
              <a
                href="https://robinhood.com/chain/ecosystem"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
              >
                View all on Robinhood <ExternalLink size={11} />
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Layers size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">Unable to load ecosystem apps.</p>
            <a
              href="https://robinhood.com/chain/ecosystem"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline mt-2"
            >
              Visit Robinhood Chain ecosystem <ArrowUpRight size={12} />
            </a>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {FAQ_DATA.map((faq) => (
            <FaqAccordion key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-[var(--text-muted)] leading-relaxed bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-2">
          <Info size={12} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
          <div>
            <p className="font-medium text-[var(--text-secondary)] mb-1">Stock Tokens are tokenized debt securities</p>
            <p>Issued by Robinhood Assets (Jersey) Limited. They provide economic exposure to underlying securities but do not grant investors any legal or beneficial rights in, or against the issuer of, those underlying securities.</p>
            <p className="mt-2">Stock Tokens are not registered under U.S. securities laws and may not be offered, sold, or delivered, directly or indirectly, in the United States or to, or for the account or benefit of, U.S. persons.</p>
            <p className="mt-2">Stock Tokens carry a high level of risk and are not appropriate for all investors. Investors should be prepared for the possibility of losing some or all of their investment.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-[var(--text-muted)] py-4 border-t border-[var(--border-subtle)]">
        <p>Live data from Financial Modeling Prep & Robinhood Chain · Prices may be delayed</p>
        <p className="mt-1">Stock Tokens on Chain ID 4663 · Block Explorer: robinhoodchain.blockscout.com</p>
      </div>

      {/* Detail Modal */}
      {detailSymbol && (
        <DetailModal symbol={detailSymbol} onClose={() => setDetailSymbol(null)} />
      )}
    </div>
  );
}

function isCryptoSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  if (upper.endsWith("USD") && !upper.includes(".")) return true;
  if (upper.endsWith("-USD")) return true;
  const cryptos = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC", "SHIB", "LTC", "ATOM", "UNI", "FIL", "APT", "ARB", "OP", "NEAR", "SUI", "PEPE", "WIF", "BONK", "FLOKI", "HBAR", "VET", "ALGO"];
  return cryptos.includes(upper);
}

function EcosystemLogo({ logo, name }: { logo: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo || failed) {
    return <span className="text-xs font-bold text-[var(--accent)]">{name.slice(0, 2).toUpperCase()}</span>;
  }
  return <img src={logo} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

function LiveBoard({ quotes, onSelect }: { quotes: MarketQuote[]; onSelect: (s: string) => void }) {
  if (quotes.length === 0) return (
    <div className="text-center py-12 text-sm text-[var(--text-muted)]">No assets loaded. Check your connection.</div>
  );

  const sorted = [...quotes].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {sorted.map((q) => {
        const positive = q.changePercent >= 0;
        return (
          <button
            key={q.symbol}
            onClick={() => onSelect(q.symbol)}
            className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 hover:border-[var(--accent)]/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">{q.symbol}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded font-medium shrink-0 ${
                    q.category === "crypto" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {q.category === "crypto" ? "C" : "S"}
                  </span>
                </div>
                <div className="text-[9px] text-[var(--text-muted)] truncate">{q.name}</div>
              </div>
              <MiniSparkline data={q.sparkline} positive={positive} />
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-base font-bold">{formatPrice(q.price)}</span>
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${positive ? "text-green-400" : "text-red-400"}`}>
                {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {positive ? "+" : ""}{q.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
              <span>Vol {formatVolume(q.volume)}</span>
              <span>MCap {formatMarketCap(q.marketCap)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TxnsFeed({ txns, loading }: { txns: LiveTxn[]; loading: boolean }) {
  if (loading && txns.length === 0) return (
    <div className="space-y-2">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />)}
    </div>
  );

  if (txns.length === 0) return (
    <div className="text-center py-12 text-sm text-[var(--text-muted)]">No recent transactions available.</div>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] px-3 pb-1.5 border-b border-[var(--border)]">
        <span className="flex-[2]">Token</span>
        <span className="flex-1 text-right">Price</span>
        <span className="flex-1 text-right">Change</span>
        <span className="flex-1 text-right">Buys</span>
        <span className="flex-1 text-right">Sells</span>
      </div>
      {txns.map((tx, i) => {
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
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 flex items-center justify-center text-[7px] font-bold text-[var(--accent)] shrink-0">
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
  );
}
