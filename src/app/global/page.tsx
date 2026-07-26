"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Globe,
  Newspaper,
  Image,
  Video,
  MapPin,
  ExternalLink,
  Clock,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  source?: string;
  thumbnail?: string;
  publishedAt?: string;
  latitude?: number;
  longitude?: number;
}

type SearchCategory = "web" | "news" | "images" | "videos" | "maps";

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  searchTime: number;
  totalResults: number;
  error: string;
}

const categories: { key: SearchCategory; label: string; icon: React.ReactNode }[] = [
  { key: "web", label: "Web", icon: <Globe size={14} /> },
  { key: "news", label: "News", icon: <Newspaper size={14} /> },
  { key: "images", label: "Images", icon: <Image size={14} /> },
  { key: "videos", label: "Videos", icon: <Video size={14} /> },
  { key: "maps", label: "Maps", icon: <MapPin size={14} /> },
];

const suggestions = [
  "Robinhood Chain ecosystem",
  "Web3 development",
  "Smart contract security",
  "DeFi protocols",
  "Blockchain scalability",
  "Token economics",
  "NFT marketplace",
  "DAO governance",
  "Layer 2 solutions",
  "Crypto regulations 2026",
];

export default function GlobalPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("web");
  const [search, setSearch] = useState<SearchState>({
    results: [],
    loading: false,
    searchTime: 0,
    totalResults: 0,
    error: "",
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = async (q: string, cat: SearchCategory) => {
    if (!q.trim()) return;
    setSearch((s) => ({ ...s, loading: true, error: "" }));
    setHasSearched(true);

    if (!searchHistory.includes(q.trim())) {
      setSearchHistory((h) => [q.trim(), ...h].slice(0, 10));
    }

    try {
      const res = await fetch(
        `/api/global?q=${encodeURIComponent(q.trim())}&category=${cat}`
      );
      const data = await res.ok ? await res.json() : { error: "Search failed" };
      setSearch({
        results: data.results || [],
        loading: false,
        searchTime: data.searchTime || 0,
        totalResults: data.totalResults || 0,
        error: data.error || "",
      });
    } catch {
      setSearch((s) => ({
        ...s,
        loading: false,
        error: "Search failed. Please try again.",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, category);
  };

  const handleCategoryChange = (cat: SearchCategory) => {
    setCategory(cat);
    if (hasSearched && query.trim()) {
      doSearch(query, cat);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
    doSearch(s, category);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      {/* Hero */}
      <section className="text-center space-y-4 pt-4 md:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-xs text-[var(--accent)]">
          <Sparkles size={12} />
          Global Search Engine
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          <span className="gradient-text">Global</span>
        </h1>
        <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-sm leading-relaxed">
          A powerful global search engine that delivers fast, accurate results across web, news, images, videos, and maps.
        </p>
      </section>

      {/* Search Bar */}
      <section className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)]/40 focus-within:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-300">
            <div className="pl-4 text-[var(--text-muted)]">
              <Search size={18} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything..."
              className="flex-1 bg-transparent px-3 py-3.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setHasSearched(false); setSearch({ results: [], loading: false, searchTime: 0, totalResults: 0, error: "" }); }}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={search.loading || !query.trim()}
              className="px-6 py-3.5 bg-[var(--accent)] text-black text-sm font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {search.loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  category === cat.key
                    ? "bg-[var(--accent)] text-black shadow-[0_0_12px_var(--accent-glow)]"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Search History */}
      {!hasSearched && searchHistory.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Recent searches</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {searchHistory.map((h, i) => (
              <button
                key={`${h}-${i}`}
                onClick={() => handleSuggestionClick(h)}
                className="px-2.5 py-1 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions (pre-search) */}
      {!hasSearched && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)]">Try searching</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-2.5 py-1 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results Header */}
      {hasSearched && !search.loading && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {search.totalResults} results for &ldquo;<span className="text-[var(--text)]">{query}</span>&rdquo; in {category}
          </span>
          <span>{search.searchTime.toLocaleString()}ms</span>
        </div>
      )}

      {/* Error */}
      {search.error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {search.error}
        </div>
      )}

      {/* Loading */}
      {search.loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
          <span className="text-sm text-[var(--text-muted)]">Searching across {category}...</span>
        </div>
      )}

      {/* Results */}
      {!search.loading && hasSearched && search.results.length > 0 && (
        <section>
          {category === "images" ? (
            <ImageGrid results={search.results} />
          ) : category === "videos" ? (
            <VideoGrid results={search.results} />
          ) : category === "maps" ? (
            <MapsGrid results={search.results} />
          ) : (
            <ResultsList results={search.results} category={category} />
          )}
        </section>
      )}

      {/* No Results */}
      {!search.loading && hasSearched && search.results.length === 0 && !search.error && (
        <div className="text-center py-16 space-y-3">
          <Search size={32} className="mx-auto text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            No results found for &ldquo;{query}&rdquo; in {category}.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Try different keywords or switch categories.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-[var(--text-muted)] py-8 border-t border-[var(--border-subtle)]" role="contentinfo">
        <p>
          Powered by{" "}
          <a href="https://duckduckgo.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">DuckDuckGo</a>,{" "}
          <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">YouTube</a>,{" "}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">OpenStreetMap</a>, and{" "}
          <a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Wikipedia</a>
        </p>
        <p className="mt-1">Global — Global search engine by GAMBO RH</p>
      </footer>
    </div>
  );
}

function ResultsList({ results, category }: { results: SearchResult[]; category: SearchCategory }) {
  return (
    <div className="space-y-2">
      {results.map((result, i) => (
        <a
          key={result.id}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-200 group fade-in"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="flex items-start gap-3">
            {result.thumbnail && (
              <img
                src={result.thumbnail}
                alt={result.title}
                className="w-16 h-16 rounded-lg object-cover border border-[var(--border)] flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-[var(--text-muted)] truncate">{result.source || new URL(result.url).hostname}</span>
                {result.publishedAt && (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    · {timeAgo(result.publishedAt)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                {result.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                {result.description}
              </p>
              {category === "news" && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Newspaper size={10} className="text-[var(--text-muted)]" />
                  <span className="text-[10px] text-[var(--accent)]">News</span>
                </div>
              )}
            </div>
            <ExternalLink size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </div>
  );
}

function ImageThumb({ result }: { result: SearchResult }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="aspect-square flex items-center justify-center bg-[var(--bg-card)]">
        <Image size={24} className="text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="aspect-square overflow-hidden">
      <img
        src={result.thumbnail}
        alt={result.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

function ImageGrid({ results }: { results: SearchResult[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {results.map((result, i) => (
        <a
          key={result.id}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-200 fade-in"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {result.thumbnail ? (
            <ImageThumb result={result} />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-[var(--bg-card)]">
              <Image size={24} className="text-[var(--text-muted)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-[10px] text-white truncate">{result.title}</p>
            <p className="text-[9px] text-white/70">{result.source}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function VideoThumb({ result }: { result: SearchResult }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-card)]">
        <Video size={32} className="text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <img
      src={result.thumbnail}
      alt={result.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setImgError(true)}
    />
  );
}

function VideoGrid({ results }: { results: SearchResult[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {results.map((result, i) => (
        <a
          key={result.id}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-200 fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="relative aspect-video overflow-hidden">
            {result.thumbnail ? (
              <VideoThumb result={result} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--bg-card)]">
                <Video size={32} className="text-[var(--text-muted)]" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-black transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
              {result.title}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">
              {result.description}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[var(--text-muted)]">{result.source}</span>
              {result.publishedAt && (
                <span className="text-[10px] text-[var(--text-muted)]">· {result.publishedAt}</span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function MapsGrid({ results }: { results: SearchResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((result, i) => (
        <a
          key={result.id}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-200 fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {result.title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
              {result.description}
            </p>
            {result.latitude != null && result.longitude != null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                </span>
                <span className="text-[10px] text-[var(--accent)]">Open in map →</span>
              </div>
            )}
          </div>
          <ExternalLink size={12} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0 mt-1" />
        </a>
      ))}
    </div>
  );
}

function timeAgo(timestamp: string): string {
  const ts = new Date(timestamp).getTime() / 1000;
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
