"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ExternalLink, Clock, Zap, RotateCw } from "lucide-react";

interface RecentTx {
  hash: string;
  from: string;
  to: string;
  fromEns: string | null;
  toEns: string | null;
  value: string;
  fee: string;
  status: string;
  method: string;
  block: number;
  timestamp: string;
  type: string;
  tokenInfo: {
    symbol: string | null;
    name: string | null;
    icon: string | null;
    amount: string;
  } | null;
  nonce: number;
}

function timeAgo(timestamp: string) {
  const ts = timestamp.includes("T") ? new Date(timestamp).getTime() / 1000 : parseInt(timestamp);
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatAddr(addr: string, ens: string | null) {
  if (ens) return ens;
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatValue(val: string) {
  const eth = parseFloat(val);
  if (eth >= 1e6) return `${(eth / 1e6).toFixed(2)}M`;
  if (eth >= 1e3) return `${(eth / 1e3).toFixed(2)}K`;
  if (eth === 0) return "0";
  if (eth < 0.0001) return "<0.0001";
  return eth.toFixed(4);
}

export default function LiveTransactions() {
  const [txs, setTxs] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/recent-transactions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTxs(data.transactions || []);
      setLastUpdate(new Date());
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {lastUpdate && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] live-blink" />
            Live feed
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
            <Clock size={10} />
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}

      <div className="space-y-1.5" role="list" aria-label="Recent transactions">
        {txs.slice(0, 12).map((tx, i) => {
          const isError = tx.status === "error";
          const hasValue = parseFloat(tx.value) > 0;
          const isToken = tx.type === "token_transfer" && tx.tokenInfo;

          return (
            <a
              key={tx.hash + i}
              href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 card-stagger ${
                isError
                  ? "bg-[var(--surface)] border-red-500/20 hover:border-red-500/40"
                  : "bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--accent)]/25 hover:shadow-[0_2px_12px_rgba(0,200,5,0.04)]"
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
              role="listitem"
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isError ? "bg-red-500/10 text-red-400" : "bg-[var(--accent)]/10 text-[var(--accent)]"
              }`}>
                {isError ? (
                  <RotateCw size={14} className="text-red-400" />
                ) : isToken ? (
                  tx.tokenInfo?.icon ? (
                    <img src={tx.tokenInfo.icon} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <Zap size={14} />
                  )
                ) : (
                  <ArrowUpRight size={14} />
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono text-[var(--foreground)] truncate">
                    {formatAddr(tx.from, tx.fromEns)}
                  </span>
                  <ArrowUpRight size={10} className="text-[var(--text-muted)] flex-shrink-0" />
                  <span className="text-[12px] font-mono text-[var(--foreground)] truncate">
                    {formatAddr(tx.to, tx.toEns)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(tx.timestamp)} ago
                  </span>
                  {tx.method && tx.method !== "Transfer" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                      {tx.method.split("(")[0]}
                    </span>
                  )}
                  {isToken && tx.tokenInfo?.symbol && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-medium">
                      {tx.tokenInfo.symbol}
                    </span>
                  )}
                </div>
              </div>

              {/* Value + Link */}
              <div className="text-right flex-shrink-0">
                {hasValue && (
                  <div className="text-[12px] font-mono font-medium text-[var(--foreground)]">
                    {formatValue(tx.value)} ETH
                  </div>
                )}
                {isToken && tx.tokenInfo?.amount && (
                  <div className="text-[11px] font-mono text-yellow-400">
                    {formatValue(tx.tokenInfo.amount)}
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <ExternalLink size={9} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {txs.length === 0 && (
        <div className="text-center py-6 text-sm text-[var(--text-muted)]">
          No transactions found
        </div>
      )}
    </div>
  );
}
