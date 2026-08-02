"use client";

import XProfileCard from "@/components/XProfileCard";

const X_BRAND = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const OFFICIAL_HANDLE = "officialWALLrh";
const LEAD_HANDLE = "suggestionii";

export default function TeamPage() {
  return (
    <div className="space-y-10 fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Real X profiles only — the people and official channels behind THE WALL
        </p>
      </div>

      {/* Official X */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]">{X_BRAND}</span>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Official X Account</h2>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
            @{OFFICIAL_HANDLE}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          The official page for all THE WALL announcements, market updates, and community news.
        </p>
        <XProfileCard handle={OFFICIAL_HANDLE} official />
      </section>

      {/* Community Members */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Community Members</h2>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-400 live-blink" />
            Live · Real X
          </span>
        </div>
        <XProfileCard handle={LEAD_HANDLE} />
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-xs text-[var(--text-muted)] leading-relaxed">
          THE WALL is built by a small, focused team passionate about Robinhood Chain and decentralized ecosystems.
          Only real, live X profiles are showcased. Follow{" "}
          <a
            href={`https://x.com/${OFFICIAL_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            @{OFFICIAL_HANDLE}
          </a>{" "}
          for official updates and{" "}
          <a
            href={`https://x.com/${LEAD_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            @{LEAD_HANDLE}
          </a>{" "}
          for engineering.
        </div>
      </section>
    </div>
  );
}
