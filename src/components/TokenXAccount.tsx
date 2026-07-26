"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface TokenXData {
  handle: string;
  author_name: string | null;
  avatarUrl: string | null;
  tweetText: string | null;
  tweetUrl: string | null;
  tweetDate: string | null;
  tweetEngagement: { replies: number; reposts: number; likes: number } | null;
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

    const handle = builderTwitter || tokenSymbol?.toLowerCase() || "";
    if (!handle) {
      setLoading(false);
      setNotFound(true);
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
    const handle = builderTwitter || tokenSymbol;
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <div className="text-sm font-medium mb-1">No X Account Found</div>
        <div className="text-xs text-[var(--text-muted)] mb-4">
          {builderName
            ? `No official X account registered for ${builderName}`
            : `No official X account found for this ${tokenSymbol ? "token" : "address"}`
          }
        </div>
        {handle && (
          <a
            href={`https://x.com/search?q=${encodeURIComponent(`$${handle}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1DA1F2] text-xs text-white font-medium hover:bg-[#1a8cd8] transition-colors"
          >
            {`Search ${handle} on X`}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Profile header */}
      <div className="flex items-center gap-4 p-5 border-b border-[var(--border)]">
        {xData.avatarUrl ? (
          <img
            src={xData.avatarUrl}
            alt={xData.author_name || xData.handle}
            className="w-16 h-16 rounded-full border-2 border-[#1DA1F2]/30 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DA1F2">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{xData.author_name || xData.handle}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.06 4.3l-4.15-4.15 1.46-1.46 2.69 2.69 5.75-5.75 1.46 1.46-7.21 7.21z" />
            </svg>
          </div>
          <a
            href={`https://x.com/${xData.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--text-muted)] hover:text-[#1DA1F2] transition-colors"
          >
            @{xData.handle}
          </a>
        </div>
        <a
          href={`https://x.com/${xData.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1DA1F2] text-sm text-white font-medium hover:bg-[#1a8cd8] transition-colors flex-shrink-0"
        >
          Follow
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Latest tweet */}
      <div className="p-5">
        {xData.tweetText ? (
          <div className="space-y-3">
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
                className="inline-flex items-center gap-1 text-xs text-[#1DA1F2] hover:underline"
              >
                View on X <ExternalLink size={10} />
              </a>
            )}
            {/* Engagement row */}
            {xData.tweetEngagement && (
              <div className="flex items-center gap-5 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {xData.tweetEngagement.replies}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                  {xData.tweetEngagement.reposts}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  {xData.tweetEngagement.likes}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                  Share
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-[var(--text-muted)] mb-3">No recent tweets</div>
            <a
              href={`https://x.com/${xData.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#1DA1F2] hover:underline"
            >
              Visit profile on X <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
