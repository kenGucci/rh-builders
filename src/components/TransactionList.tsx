"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, ExternalLink, Clock, Flag } from "lucide-react";

interface Tx {
  hash: string;
  block_number: number;
  timestamp: string;
  from: string;
  from_name: string | null;
  from_is_contract: boolean;
  to: string | null;
  to_name: string | null;
  to_is_contract: boolean;
  to_tags: string[];
  value: string;
  gas_used: string;
  gas_limit: string;
  fee_value: string;
  method: string | null;
  status: string | null;
  type: string | null;
  transaction_types: string[];
  nonce: number;
  created_contract_address: string | null;
}

type Filter = "all" | "incoming" | "outgoing" | "contract";

const FILTERS: { key: Filter; label: string; description: string }[] = [
  { key: "all", label: "All", description: "Show all transactions" },
  { key: "incoming", label: "Incoming", description: "Show only incoming transfers received by this address" },
  { key: "outgoing", label: "Outgoing", description: "Show only outgoing transfers sent from this address" },
  { key: "contract", label: "Contract Calls", description: "Show only smart contract interactions" },
];

export default function TransactionList({ address }: { address: string }) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const PAGE_SIZE = 15;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/transactions?address=${address}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTxs(data.transactions || []);
      } catch {
        setTxs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const filteredTxs = useMemo(() => {
    return txs.filter((tx) => {
      const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
      const isContractCall = tx.to_is_contract || !!tx.method || tx.transaction_types.includes("contract_call");
      switch (filter) {
        case "incoming": return !isOutgoing;
        case "outgoing": return isOutgoing;
        case "contract": return isContractCall;
        default: return true;
      }
    });
  }, [txs, filter, address]);

  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading transaction history">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-lg animate-shimmer" style={{ background: "var(--surface)" }} aria-hidden="true" />
        ))}
        <span className="sr-only">Loading transaction history from Blockscout...</span>
      </div>
    );
  }

  const paginatedTxs = filteredTxs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredTxs.length / PAGE_SIZE);

  function formatValue(val: string) {
    try {
      const wei = BigInt(val);
      const eth = Number(wei) / 1e18;
      if (eth >= 1e6) return `${(eth / 1e6).toFixed(2)}M`;
      if (eth >= 1e3) return `${(eth / 1e3).toFixed(2)}K`;
      if (eth === 0) return "0";
      return eth.toFixed(6);
    } catch {
      return "0";
    }
  }

  function formatFee(val: string) {
    try {
      const wei = BigInt(val);
      const eth = Number(wei) / 1e18;
      if (eth === 0) return "0";
      if (eth < 0.001) return `${(eth * 1e6).toFixed(0)} μETH`;
      return eth.toFixed(6);
    } catch {
      return "0";
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
    return ts.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function isReward(tx: Tx) {
    const m = tx.method?.toLowerCase() || "";
    return m.includes("transfer") || m.includes("claim") || m.includes("distribute");
  }

  function reportScam(tx: Tx) {
    const text = `⚠️ Scam Report on Robinhood Chain\n\nAddress: ${address}\nTransaction: https://robinhoodchain.blockscout.com/tx/${tx.hash}\n\n#RobinhoodChain #ScamAlert #THEWALL`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      {txs.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-muted)] text-sm" role="status">
          <p>No transactions found for this address.</p>
          <p className="text-xs mt-1">Transactions appear here once the address has sent or received ETH or interacted with smart contracts on Robinhood Chain.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap" role="toolbar" aria-label="Transaction filter options">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(0); }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/20"
                }`}
                aria-label={`${f.label}: ${f.description}`}
                aria-pressed={filter === f.key}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-[var(--text-muted)]" aria-live="polite">
              {filteredTxs.length} transaction{filteredTxs.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Pagination */}
          <nav className="flex items-center justify-end mb-3 gap-2" aria-label="Transaction list pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md disabled:opacity-30 hover:border-[var(--accent)]/30 transition-colors"
              aria-label="Go to previous page of transactions"
            >
              Prev
            </button>
            <span className="text-xs text-[var(--text-muted)]" aria-live="polite">Page {page + 1} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md disabled:opacity-30 hover:border-[var(--accent)]/30 transition-colors"
              aria-label="Go to next page of transactions"
            >
              Next
            </button>
          </nav>

          <div className="space-y-1.5" role="list" aria-label="Transaction list">
            {paginatedTxs.map((tx, i) => {
              const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
              const isError = tx.status === "error";
              const hasValue = BigInt(tx.value || "0") > BigInt(0);
              const typeLabel = tx.method
                ? tx.method.split("(")[0]
                : tx.transaction_types.includes("contract_creation") ? "Deploy" : null;
              const reward = isReward(tx);

              return (
                <div
                  key={tx.hash}
                  className={`tx-row group bg-[var(--surface)] border rounded-lg p-3 md:p-4 transition-all duration-200 row-slide ${
                    isError ? "border-red-500/20" : "border-[var(--border)] hover:border-[var(--accent)]/30"
                  }`}
                  style={{ animationDelay: `${i * 25}ms`, animationFillMode: "both" }}
                  role="listitem"
                  aria-label={`Transaction ${tx.hash.slice(0, 10)} — ${isOutgoing ? 'outgoing' : 'incoming'}${hasValue ? `, ${formatValue(tx.value)} ETH` : ''}${typeLabel ? `, method: ${typeLabel}` : ''}${reward ? ', reward' : ''}${isError ? ', failed' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isError ? "bg-red-500/10 text-red-400" : isOutgoing ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                      }`} aria-hidden="true">
                        {isError ? "ERR" : isOutgoing ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                            aria-label={`View transaction ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)} on Blockscout`}
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                          </a>
                          {typeLabel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] flex-shrink-0" aria-label={`Method: ${typeLabel}`}>
                              {typeLabel}
                            </span>
                          )}
                          {reward && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0 font-medium" aria-label="This transaction is a reward distribution">
                              REWARD
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <Clock size={10} aria-hidden="true" />
                          {tx.to ? (
                            <>
                              {isOutgoing ? "To" : "From"}:{" "}
                              <span className="font-mono">{isOutgoing ? `${tx.to.slice(0, 8)}...${tx.to.slice(-4)}` : `${tx.from.slice(0, 8)}...${tx.from.slice(-4)}`}</span>
                            </>
                          ) : (
                            <span className="text-[var(--accent)]">Contract Creation</span>
                          )}
                          <span className="mx-0.5" aria-hidden="true">·</span>
                          <span title={formatTimestamp(tx.timestamp)}>{timeAgo(tx.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => reportScam(tx)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 flex-shrink-0"
                        aria-label={`Report transaction ${tx.hash.slice(0, 10)} as a scam on X`}
                      >
                        <Flag size={10} aria-hidden="true" />
                      </button>

                      <div className="text-right">
                        {hasValue && (
                          <div className={`text-sm font-mono ${isOutgoing ? "text-red-400" : "text-green-400"}`} aria-label={`${isOutgoing ? 'Sent' : 'Received'} ${formatValue(tx.value)} ETH`}>
                            {isOutgoing ? "-" : "+"}{formatValue(tx.value)} ETH
                          </div>
                        )}
                        <div className="text-xs text-[var(--text-muted)] flex items-center justify-end gap-1.5">
                          {BigInt(tx.fee_value || "0") > BigInt(0) && (
                            <span title="Gas fee paid for this transaction">⛽ {formatFee(tx.fee_value)}</span>
                          )}
                          <a
                            href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--accent)]"
                            aria-label={`View full transaction details on Blockscout`}
                          >
                            <ExternalLink size={10} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {tx.created_contract_address && (
                    <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="text-[var(--accent)]">Created contract:</span>
                      <a href={`/builder/${tx.created_contract_address}`} className="font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" aria-label={`View created contract ${tx.created_contract_address.slice(0, 10)}...${tx.created_contract_address.slice(-6)}`}>
                        {tx.created_contract_address.slice(0, 10)}...{tx.created_contract_address.slice(-6)}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
