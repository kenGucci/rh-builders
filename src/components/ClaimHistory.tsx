"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import AddressAvatar from "@/components/AddressAvatar";
import { Gift, Coins, ExternalLink } from "lucide-react";

interface Claim {
  tx_hash: string;
  block_number: number;
  timestamp: string;
  from: string;
  from_name: string | null;
  to: string;
  amount: string;
  token_symbol: string;
  token_name: string;
  token_address: string | null;
  token_icon: string | null;
  token_decimals: string;
  token_type: string;
  type: string;
  usd_value: string | null;
}

export default function ClaimHistory({ address }: { address: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/claims?address=${address}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setClaims(data.claims || []);
      } catch {
        setClaims([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const summary = useMemo(() => {
    const totalTransfers = claims.length;
    const uniqueTokens = new Set(claims.map((c) => c.token_symbol)).size;
    return { totalTransfers, uniqueTokens };
  }, [claims]);

  const groupedClaims = useMemo(() => {
    const groups = new Map<string, Claim[]>();
    for (const c of claims) {
      const key = c.token_symbol;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [claims]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading claim history">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg animate-shimmer" style={{ background: "var(--surface)" }} aria-hidden="true" />
        ))}
        <span className="sr-only">Loading token claim history from Blockscout...</span>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <Gift size={28} className="text-[var(--text-muted)]" />
        </div>
        <div className="text-sm font-medium mb-1">No rewards claimed yet</div>
        <div className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
          Token transfers and reward distributions to this address will appear here once received. Claims are tracked via ERC-20 token transfer events on Robinhood Chain.
        </div>
      </div>
    );
  }

  function formatAmount(raw: string, decimals: string) {
    try {
      const d = parseInt(decimals) || 18;
      const num = BigInt(raw);
      const divisor = BigInt(10 ** d);
      const whole = num / divisor;
      const frac = num % divisor;
      const fracStr = frac.toString().padStart(Math.min(d, 4), "0").slice(0, 4);
      const val = parseFloat(`${whole}.${fracStr}`);
      if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
      if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
      return `${whole.toLocaleString()}.${fracStr}`;
    } catch {
      return raw;
    }
  }

  function timeAgo(timestamp: string) {
    const ts = timestamp.includes("T") ? new Date(timestamp).getTime() / 1000 : parseInt(timestamp);
    const diff = Date.now() / 1000 - ts;
    if (diff < 0) return "just now";
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function formatTimestamp(timestamp: string) {
    const ts = timestamp.includes("T") ? new Date(timestamp) : new Date(parseInt(timestamp) * 1000);
    return ts.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const paginatedClaims = claims.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(claims.length / PAGE_SIZE);

  return (
    <div>
      {/* Summary card */}
      <div className="grid grid-cols-2 gap-3 mb-4" role="list" aria-label="Claim history summary">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4" role="listitem" aria-label={`Total token transfers: ${summary.totalTransfers}`}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Total Transfers</div>
          <div className="text-xl font-bold gradient-text">{summary.totalTransfers.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Incoming token transfers to this address</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4" role="listitem" aria-label={`Unique tokens received: ${summary.uniqueTokens}`}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Unique Tokens</div>
          <div className="text-xl font-bold gradient-text">{summary.uniqueTokens.toLocaleString()}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Different tokens received as rewards</div>
        </div>
      </div>

      {/* Token groups */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-[var(--text-muted)]" aria-live="polite">
          {claims.length} claim{claims.length !== 1 ? "s" : ""} across {summary.uniqueTokens} token{summary.uniqueTokens !== 1 ? "s" : ""}
        </div>
        <nav className="flex items-center gap-2" aria-label="Claim list pagination">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md disabled:opacity-30 hover:border-[var(--accent)]/30 transition-colors"
            aria-label="Previous page"
          >
            Prev
          </button>
          <span className="text-xs text-[var(--text-muted)]" aria-live="polite">Page {page + 1} of {totalPages || 1}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md disabled:opacity-30 hover:border-[var(--accent)]/30 transition-colors"
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      </div>

      {/* Grouped token labels */}
      {groupedClaims.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4" role="list" aria-label="Token breakdown">
          {groupedClaims.map(([symbol, items]) => (
            <div key={symbol} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px]" role="listitem" aria-label={`${symbol}: ${items.length} transfers`}>
              {items[0].token_icon ? (
                <>
                  <Image src={items[0].token_icon} alt={`${symbol} token icon`} width={14} height={14} className="w-3.5 h-3.5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                  <Coins size={10} className="text-[var(--accent)] hidden" aria-hidden="true" />
                </>
              ) : (
                <Coins size={10} className="text-[var(--accent)]" aria-hidden="true" />
              )}
              <span className="text-[var(--text-secondary)] font-medium">${symbol}</span>
              <span className="text-[var(--text-muted)]">×{items.length}</span>
            </div>
          ))}
        </div>
      )}

      {/* Claims list */}
      <div className="space-y-1.5" role="list" aria-label="Claim history list">
        {paginatedClaims.map((c, i) => (
          <div
            key={`${c.tx_hash}-${i}`}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 md:p-4 hover:border-[var(--accent)]/30 transition-all duration-200 fade-in"
            style={{ animationDelay: `${i * 25}ms`, animationFillMode: "both" }}
            role="listitem"
            aria-label={`Received ${formatAmount(c.amount, c.token_decimals)} ${c.token_symbol} from ${c.from.slice(0, 6)}...${c.from.slice(-4)}, ${timeAgo(c.timestamp)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {c.token_icon ? (
                  <>
                    <Image src={c.token_icon} alt={`${c.token_symbol} token icon`} width={32} height={32} className="w-8 h-8 rounded-full border border-[var(--border)] flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)] flex-shrink-0 hidden" aria-hidden="true">
                      {c.token_symbol?.slice(0, 2) || "?"}
                    </div>
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)] flex-shrink-0" aria-hidden="true">
                    {c.token_symbol?.slice(0, 2) || "?"}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--accent)]">
                      +{formatAmount(c.amount, c.token_decimals)}
                    </span>
                    {c.token_address ? (
                      <a
                        href={`https://robinhoodchain.blockscout.com/token/${c.token_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                        aria-label={`View ${c.token_symbol} token on Blockscout`}
                      >
                        ${c.token_symbol}
                      </a>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                        ${c.token_symbol}
                      </span>
                    )}
                    {c.token_name && c.token_name !== c.token_symbol && (
                      <span className="text-xs text-[var(--text-muted)] hidden sm:inline">{c.token_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                    <AddressAvatar address={c.from} size={14} className="rounded-sm" aria-hidden="true" />
                    <span>From: {`${c.from.slice(0, 6)}...${c.from.slice(-4)}`}</span>
                    <span className="mx-0.5" aria-hidden="true">·</span>
                    <span title={formatTimestamp(c.timestamp)}>{timeAgo(c.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xs text-[var(--text-muted)]">
                  Block #{c.block_number.toLocaleString()}
                </div>
                <a
                  href={`https://robinhoodchain.blockscout.com/tx/${c.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 justify-end"
                  aria-label={`View transaction ${c.tx_hash.slice(0, 10)} on Blockscout`}
                >
                  TX <ExternalLink size={9} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
