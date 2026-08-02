"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

interface SearchResult {
  type: string;
  matchType?: string;
  address: string | null;
  label: string | null;
  token_symbol?: string | null;
  token_name?: string | null;
  creator?: string | null;
  twitter?: string | null;
  message?: string | null;
  token_info?: {
    name: string;
    symbol: string;
    holders_count: number;
    total_supply: string;
  } | null;
}

function resultUrl(s: SearchResult): string | null {
  if (s.type === "x") {
    const handle = (s.twitter as string | undefined) || s.label || (s.address ? s.address.replace(/^@/, "") : "");
    return handle ? `/x/${encodeURIComponent(handle)}` : null;
  }
  if (!s.address) return null;
  if (s.matchType === "project" && s.creator) {
    return `/builder/${s.creator}?ca=${s.address}`;
  }
  if (s.matchType === "x" || (s.type === "token" && !s.creator)) {
    return `/builder/${s.address}?tab=xaccount`;
  }
  if (s.matchType === "wallet" || s.type === "address") {
    return `/builder/${s.address}?tab=claims`;
  }
  if (s.type === "contract") return `/builder/${s.address}?tab=claims`;
  return `/builder/${s.address}`;
}

// Client-side query cache — repeat searches resolve instantly
const queryCache = new Map<string, { result: SearchResult | null; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export default function SearchBar({ compact = false, value, onValueChange }: { compact?: boolean; value?: string; onValueChange?: (v: string) => void }) {
  const isControlled = value !== undefined;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNavigate = async (q: string) => {
    if (!q.trim()) return;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.ok ? await res.json() : {};
      if (data.address && data.type !== "unknown") {
        const url = resultUrl(data);
        if (url) router.push(url);
      }
    } catch {}
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchResult(null);

    const trimmed = q.trim();

    try {
      const key = trimmed.toLowerCase();
      const cached = queryCache.get(key);
      let data: SearchResult;
      if (cached && cached.expires > Date.now() && cached.result) {
        data = cached.result;
      } else {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        data = await res.ok ? await res.json() : {};
        queryCache.set(key, { result: data, expires: Date.now() + CACHE_TTL });
        if (queryCache.size > 200) {
          const oldest = queryCache.keys().next().value;
          if (oldest) queryCache.delete(oldest);
        }
      }

      if (data.type === "unknown" || !data.address) {
        setSearchResult({
          type: "unknown",
          address: null,
          label: null,
          message: data.message || `No results found for "${trimmed}". Try a wallet address, token name, or contract address.`,
        });
        setLoading(false);
        return;
      }

      if (data.type === "token" && data.address) {
        setSearchResult(data);
        setLoading(false);
        return;
      }

      if ((data.type === "address" || data.type === "contract") && data.address) {
        setSearchResult(data);
        setLoading(false);
        return;
      }

      setSearchResult({
        type: "unknown",
        address: null,
        label: null,
        message: `No results found for "${trimmed}". Try a wallet address, token name, or contract address.`,
      });
      setLoading(false);
    } catch {
      setLoading(false);
      setError("Search failed. Please try again.");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleInputChange = (val: string) => {
    if (isControlled) {
      onValueChange!(val);
      return;
    }
    setQuery(val);
    setError("");
    setSearchResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.ok ? await res.json() : {};
        if (data.address) {
          setSuggestions([data]);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {}
    }, 350);
  };

  const pickSuggestion = (s: SearchResult) => {
    setShowSuggestions(false);
    setSearchResult(null);
    const url = resultUrl(s);
    if (url) router.push(url);
  };

  const openResult = (s: SearchResult) => {
    const url = resultUrl(s);
    if (url) router.push(url);
  };

  if (compact) {
    const currentValue = isControlled ? value : query;
    const handleCompactSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (!isControlled) {
        handleSearch(query);
      }
    };
    return (
      <form onSubmit={handleCompactSubmit} className="flex-1">
        <div className="space-y-2">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden focus-within:border-[var(--accent)]/40 focus-within:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300">
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="pl-3 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer flex-shrink-0"
              aria-label="Focus search input"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={currentValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => !isControlled && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search CA, X handle, or wallet..."
              className="flex-1 bg-transparent px-2.5 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)]"
            />
            {isControlled && currentValue ? (
              <button
                type="button"
                onClick={() => onValueChange!("")}
                className="px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : null}
            {!isControlled && (
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-[var(--accent)] text-black text-sm font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <span className="inline-block w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Go"}
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="space-y-2.5" ref={wrapperRef}>
        <div className="relative flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)]/40 focus-within:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-300">
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="pl-4 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer flex-shrink-0"
            aria-label="Focus search input"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search contract address (CA), X handle (@), or wallet (0x...)"
            className="flex-1 bg-transparent px-3 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3.5 bg-[var(--accent)] text-black text-sm font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Search"}
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden fade-in">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    {s.type === "token" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M6 12h12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.label || s.address}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      {s.type === "token" && s.token_symbol && <span>${s.token_symbol} · </span>}
                      {s.type === "token" && s.creator && <span>Dev: {s.creator.slice(0, 6)}...{s.creator.slice(-4)}</span>}
                      {s.type !== "token" && s.address && <span>{s.address.slice(0, 10)}...{s.address.slice(-6)}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase flex-shrink-0">
                    {s.matchType || s.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
        <p className="text-xs text-[var(--text-muted)] pl-1">
          Search by contract address (CA) to trace developer · X handle (@) · or wallet address (0x...)
        </p>
      </div>

      {/* Inline search result */}
      {searchResult && (
        <div className="mt-4 fade-in">
          {searchResult.type === "unknown" ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">No results found</p>
              <p className="text-xs text-[var(--text-muted)]">{searchResult.message}</p>
            </div>
          ) : (
            <button
              onClick={() => openResult(searchResult)}
              className="w-full text-left bg-[var(--surface)] border border-[var(--accent)]/30 rounded-xl p-4 hover:border-[var(--accent)]/60 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  {searchResult.type === "token" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M6 12h12" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{searchResult.label || "Unknown"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] uppercase">{searchResult.type}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 truncate">
                    {searchResult.address}
                  </div>
                  {searchResult.token_info && (
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                      {searchResult.token_info.symbol && <span>${searchResult.token_info.symbol}</span>}
                      {searchResult.token_info.holders_count > 0 && <span>{searchResult.token_info.holders_count.toLocaleString()} holders</span>}
                    </div>
                  )}
                  {searchResult.creator && (
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Deployed by: {searchResult.creator.slice(0, 10)}...{searchResult.creator.slice(-6)}
                    </div>
                  )}
                </div>
                <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
              </div>
              <div className="mt-2 text-[11px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity text-center">
                View full builder profile →
              </div>
            </button>
          )}
        </div>
      )}
    </form>
  );
}
