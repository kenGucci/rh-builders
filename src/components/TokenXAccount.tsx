"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Users } from "lucide-react";

interface TokenXData {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  description: string | null;
  followers: number | null;
  following: number | null;
  bannerUrl: string | null;
  verified: boolean;
  tweetText: string | null;
  tweetUrl: string | null;
  tweetDate: string | null;
}

interface Props {
  tokenSymbol?: string;
  tokenAddress?: string;
  builderTwitter?: string;
  builderName?: string;
}

export default function TokenXAccount({ tokenSymbol, tokenAddress, builderTwitter, builderName }: Props) {
  const [xData, setXData] = useState<TokenXData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!builderTwitter && !tokenSymbol && !tokenAddress) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);

    const handle = builderTwitter || "";
    if (!handle) {
      // No explicit twitter handle, try searching by token symbol
      if (tokenSymbol) {
        // Try fetching with the token symbol as a potential handle
        fetch(`/api/twitter?handle=${encodeURIComponent(tokenSymbol)}`)
          .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
          .then((data) => {
            if (data.handle && !data.error) {
              setXData(data);
              setNotFound(false);
            } else {
              setNotFound(true);
            }
          })
          .catch(() => setNotFound(true))
          .finally(() => setLoading(false));
      } else {
        setNotFound(true);
        setLoading(false);
      }
      return;
    }

    fetch(`/api/twitter?handle=${handle}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.error || !data.handle) {
          setNotFound(true);
          setXData(null);
        } else {
          setXData(data);
          setNotFound(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setXData(null);
      })
      .finally(() => setLoading(false));
  }, [builderTwitter, tokenSymbol, tokenAddress]);

  if (loading) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
            <div className="h-4 w-28 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
          <div className="h-4 w-1/2 rounded animate-shimmer" style={{ background: "var(--bg-card-hover)" }} />
        </div>
      </div>
    );
  }

  if (notFound || !xData) {
    const searchQuery = builderTwitter || tokenSymbol || (tokenAddress ? tokenAddress.slice(0, 10) : "");
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#000]/10 border border-[#000]/20 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <div className="text-sm font-medium mb-1">No X Account Found</div>
        <div className="text-xs text-[var(--text-muted)] mb-4">
          {builderName
            ? `No official X account registered for ${builderName}`
            : tokenSymbol
            ? `No official X account found for $${tokenSymbol}`
            : tokenAddress
            ? `No official X account found for this token`
            : `No official X account found for this address`
          }
        </div>
        {searchQuery && (
          <div className="flex flex-col items-center gap-2">
            <a
              href={`https://x.com/search?q=${encodeURIComponent(`$${searchQuery}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-xs text-white font-medium hover:opacity-90 transition-opacity"
            >
              Search ${searchQuery} on X
              <ExternalLink size={10} />
            </a>
            <a
              href={`https://x.com/search?q=${encodeURIComponent(searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              Full search on X →
            </a>
          </div>
        )}
      </div>
    );
  }

  const formatFollowers = (n: number | null) => {
    if (n === null) return null;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Banner */}
      {xData.bannerUrl && (
        <div className="h-28 relative overflow-hidden">
          <Image src={xData.bannerUrl} alt="Banner" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        </div>
      )}

      {/* Profile header */}
      <div className={`flex items-center gap-4 p-5 ${xData.bannerUrl ? "-mt-10 relative" : ""} border-b border-[var(--border)]`}>
        {xData.avatarUrl ? (
          <Image
            src={xData.avatarUrl}
            alt={xData.displayName || xData.handle}
            width={64}
            height={64}
            className={`rounded-full border-2 border-[var(--surface)] object-cover shadow-lg ${xData.bannerUrl ? "w-16 h-16" : "w-16 h-16 border-2 border-black/10"}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-black/10 border border-black/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{xData.displayName || xData.handle}</span>
            {xData.verified && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.06 4.3l-4.15-4.15 1.46-1.46 2.69 2.69 5.75-5.75 1.46 1.46-7.21 7.21z" />
              </svg>
            )}
          </div>
          <a
            href={`https://x.com/${xData.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            @{xData.handle}
          </a>
        </div>
        <a
          href={`https://x.com/${xData.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-sm text-white font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Follow
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Profile stats */}
      {(xData.followers !== null || xData.following !== null) && (
        <div className="flex items-center gap-6 px-5 py-3 border-b border-[var(--border)]">
          {xData.followers !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Users size={13} className="text-[var(--text-muted)]" />
              <span className="font-semibold">{formatFollowers(xData.followers)}</span>
              <span className="text-[var(--text-muted)]">followers</span>
            </div>
          )}
          {xData.following !== null && (
            <div className="text-sm">
              <span className="font-semibold">{formatFollowers(xData.following)}</span>
              <span className="text-[var(--text-muted)]"> following</span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {xData.description && (
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{xData.description}</p>
        </div>
      )}

      {/* Latest tweet */}
      <div className="p-5">
        {xData.tweetText ? (
          <div className="space-y-3">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Latest Post</div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{xData.tweetText}</p>
            {xData.tweetDate && (
              <div className="text-[11px] text-[var(--text-muted)]">
                {new Date(xData.tweetDate).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            {xData.tweetUrl && (
              <a
                href={xData.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
              >
                View on X <ExternalLink size={10} />
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-[var(--text-muted)] mb-3">No recent tweets available</div>
            <a
              href={`https://x.com/${xData.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
            >
              Visit profile on X <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
