"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

interface Result {
  type: string;
  matchType?: string;
  address: string | null;
  label: string | null;
  token_symbol?: string | null;
  creator?: string | null;
  twitter?: string | null;
  message?: string | null;
}

function resultUrl(r: Result): string | null {
  if (r.type === "x") {
    const handle = r.twitter || r.label || (r.address ? r.address.replace(/^@/, "") : "");
    return handle ? `/x/${encodeURIComponent(handle)}` : null;
  }
  if (!r.address) return null;
  if (r.matchType === "project" && r.creator) return `/builder/${r.creator}?ca=${r.address}`;
  if (r.matchType === "x" || (r.type === "token" && !r.creator)) return `/builder/${r.address}?tab=xaccount`;
  if (r.matchType === "wallet" || r.type === "address") return `/builder/${r.address}?tab=claims`;
  if (r.type === "contract") return `/builder/${r.address}?tab=claims`;
  return `/builder/${r.address}`;
}

export default function HeaderSearch({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const navigate = (r: Result) => {
    const url = resultUrl(r);
    if (!url) return;
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  const runSearch = async (q: string): Promise<Result[]> => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return [];
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      const items: Result[] =
        data && data.address ? [{ ...data, id: data.address }] : [];
      setResults(items);
      setOpen(true);
      return items;
    } catch {
      setResults([]);
      setOpen(false);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const onChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 250);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (results.length > 0) {
      navigate(results[0]);
    } else {
      runSearch(query).then((items) => {
        if (items.length > 0) navigate(items[0]);
      });
    }
  };

  return (
    <div ref={wrapperRef} className={`relative flex-1 max-w-md ${className}`}>
      <form onSubmit={onSubmit} role="search" aria-label="Search builders, tokens, and contracts">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search builder, token, or 0x... (⌘K)"
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/40 focus:shadow-[0_0_16px_var(--accent-glow)] transition-all outline-none"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
        )}
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden fade-in">
          {results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(r)}
                className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[var(--accent)] uppercase">
                    {r.type === "token" ? "$" : r.type === "address" ? "0x" : "·"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">
                    {r.label || r.address}
                  </div>
                  {r.address && (
                    <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                      {r.address.slice(0, 8)}...{r.address.slice(-6)}
                    </div>
                  )}
                </div>
                {r.type === "token" && r.token_symbol && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-mono flex-shrink-0">
                    ${r.token_symbol}
                  </span>
                )}
                <ArrowUpRight size={12} className="text-[var(--text-muted)] flex-shrink-0" />
              </button>
            ))
          ) : query.trim().length >= 2 && !loading ? (
            <div className="px-4 py-4 text-center text-xs text-[var(--text-muted)]">
              No results found for &ldquo;{query}&rdquo;.
              <br />
              Try a token name, X handle, or wallet address.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
