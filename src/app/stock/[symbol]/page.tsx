"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Shield,
  Globe,
  Layers,
  Lock,
  Building2,
  Activity,
  Radar,
} from "lucide-react";
import { findStockToken, STOCK_TOKENS } from "@/lib/stock-tokens";
import { getCompanyProfile } from "@/lib/company-profiles";
import StockLogo from "@/components/StockLogo";

const StockChart = dynamic(() => import("@/components/StockChart"), { ssr: false });
const TradeModal = dynamic(() => import("@/components/TradeModal"), { ssr: false });

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

function marketStateLabel(state: string): string {
  const s = (state || "").toUpperCase();
  if (s.includes("REGULAR") || s === "REGULAR") return "Open";
  if (s.includes("PRE")) return "Pre-Market";
  if (s.includes("POST")) return "After-Hours";
  if (s === "CLOSED") return "Closed";
  return s || "—";
}

export default function StockProfilePage() {
  const { symbol } = useParams<{ symbol: string }>();
  const token = symbol ? findStockToken(symbol) : null;
  const profile = token ? getCompanyProfile(token.symbol) : null;

  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteUpdated, setQuoteUpdated] = useState<Date | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setQuote(null);
    setQuoteLoading(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/market?action=quote&symbol=${token.symbol}`);
        const data = await res.json();
        if (active && data.quote) {
          setQuote(data.quote);
          setQuoteUpdated(new Date());
        }
      } catch {}
      finally { if (active) setQuoteLoading(false); }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [token]);

  const copyAddress = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token.tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-2xl font-bold text-[var(--foreground)] mb-2">Unknown Stock Token</p>
        <p className="text-sm text-[var(--text-muted)] mb-6">{symbol} isn&apos;t a supported Stock Token.</p>
        <Link
          href="/market"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} /> Back to Market
        </Link>
      </div>
    );
  }

  const positive = (quote?.changePercent ?? 0) >= 0;
  const color = positive ? "text-green-400" : "text-red-400";
  const state = quote ? marketStateLabel(quote.marketState) : "—";
  const stateOpen = state === "Open" || state === "Pre-Market" || state === "After-Hours";
  const related = STOCK_TOKENS.filter((t) => t.sector === token.sector && t.symbol !== token.symbol).slice(0, 8);

  const stats: Array<{ label: string; value: string }> = [
    { label: "Market Cap", value: formatMarketCap(quote?.marketCap ?? null) },
    { label: "Volume (24h)", value: quote ? formatVolume(quote.volume) : "—" },
    { label: "Avg Volume", value: quote?.avgVolume ? formatVolume(quote.avgVolume) : "—" },
    { label: "P/E Ratio", value: quote?.pe ? quote.pe.toFixed(2) : "—" },
    { label: "52W High", value: quote ? formatPrice(quote.week52High) : "—" },
    { label: "52W Low", value: quote ? formatPrice(quote.week52Low) : "—" },
    { label: "Open", value: quote ? formatPrice(quote.open) : "—" },
    { label: "Previous Close", value: quote ? formatPrice(quote.previousClose) : "—" },
    { label: "Day High", value: quote ? formatPrice(quote.dayHigh) : "—" },
    { label: "Day Low", value: quote ? formatPrice(quote.dayLow) : "—" },
    { label: "Exchange", value: quote?.exchange || "—" },
    { label: "Market State", value: state },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <Link href="/market" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
        <ArrowLeft size={14} /> Back to Market
      </Link>

      {/* Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <StockLogo symbol={token.symbol} logo={token.logo} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{token.symbol}</h1>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
                  STOCK TOKEN
                </span>
              </div>
              <div className="text-sm text-[var(--text-muted)]">{token.name}</div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Radar size={10} className="text-[var(--accent)]" />{token.sector}</span>
                <span className="flex items-center gap-1"><Layers size={10} className="text-orange-400" />{token.multiplier}x multiplier</span>
                <span className="flex items-center gap-1"><Shield size={10} className="text-green-400" />1:1 backed</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-extrabold text-[var(--foreground)] tabular-nums">
                  {quoteLoading && !quote ? "—" : quote ? formatPrice(quote.price) : "—"}
                </div>
                {quote && (
                  <div className={`flex items-center gap-1 text-sm font-bold ${color}`}>
                    {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {positive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-blink" />
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTradeMode("buy"); setTradeOpen(true); }}
                className="px-5 py-2 rounded-xl bg-green-500 text-black text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Buy {token.symbol}
              </button>
              <button
                onClick={() => { setTradeMode("sell"); setTradeOpen(true); }}
                className="px-5 py-2 rounded-xl bg-red-500 text-black text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live chart */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Live Price Chart</h2>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${stateOpen ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-subtle)]"}`}>
            Market {state}
          </span>
        </div>
        <StockChart symbol={token.symbol} height={320} defaultRange="3mo" live />
        {quoteUpdated && (
          <p className="text-[10px] text-[var(--text-muted)] mt-3">Updated {quoteUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · auto-refreshing every ~15s</p>
        )}
      </div>

      {/* Live stats */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-[var(--foreground)] mb-4">Live Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 py-3">
              <div className="text-[10px] text-[var(--text-muted)] mb-1">{s.label}</div>
              <div className="text-sm font-bold text-[var(--foreground)] tabular-nums truncate">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Company profile */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Company Profile</h2>
          </div>
          {profile ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">{profile.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2">
                  <div className="text-[9px] text-[var(--text-muted)] mb-0.5">Industry</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">{profile.industry}</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2">
                  <div className="text-[9px] text-[var(--text-muted)] mb-0.5">Founded</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">{profile.founded}</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2">
                  <div className="text-[9px] text-[var(--text-muted)] mb-0.5">Headquarters</div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">{profile.headquarters}</div>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2">
                  <div className="text-[9px] text-[var(--text-muted)] mb-0.5">Website</div>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1">
                    {profile.website.replace("https://www.", "").replace("https://", "")} <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No company profile available.</p>
          )}
        </div>

        {/* Token info */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} className="text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Token Details</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2.5">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Radar size={10} />Sector</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.sector}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2.5">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Layers size={10} />Multiplier</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.multiplier}x</span>
            </div>
            <div className="flex justify-between items-center rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2.5">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Lock size={10} />Custodian</span>
              <span className="text-xs font-semibold text-[var(--foreground)]">{token.custodian}</span>
            </div>
            <div className="flex justify-between items-center rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2.5">
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Shield size={10} />Backing</span>
              <span className="text-xs font-semibold text-green-400">{token.backed ? "1:1 Real Stock" : "Unbacked"}</span>
            </div>
            <div className="rounded-lg bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] px-3 py-2.5">
              <div className="text-[10px] text-[var(--text-muted)] mb-1.5">Token Address</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-[var(--foreground)] break-all">{token.tokenAddress}</span>
                <button onClick={copyAddress} className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related tokens */}
      {related.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-[var(--foreground)] mb-4">Related {token.sector} Tokens</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t.symbol}
                href={`/stock/${t.symbol}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-colors"
              >
                <StockLogo symbol={t.symbol} logo={t.logo} size={18} />
                <span className="text-xs font-bold text-[var(--foreground)]">{t.symbol}</span>
                <span className="text-[10px] text-[var(--text-muted)] max-w-[140px] truncate">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {tradeOpen && (
        <TradeModal
          token={token}
          quote={quote ?? undefined}
          initialMode={tradeMode}
          onClose={() => setTradeOpen(false)}
        />
      )}
    </div>
  );
}
