"use client";

import XProfileCard from "@/components/XProfileCard";

const X_BRAND = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GITHUB_BRAND = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const OFFICIAL_HANDLE = "officialWALLrh";
const GITHUB_ACCOUNT = "kenGucci";
const GITHUB_URL = "https://github.com/kenGucci";

export default function TeamPage() {
  return (
    <div className="space-y-10 fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          The official accounts behind THE WALL — real profiles only.
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
        <XProfileCard handle={OFFICIAL_HANDLE} official minimal />
      </section>

      {/* Official Builder */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)]">{GITHUB_BRAND}</span>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Official Builder</h2>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-400 live-blink" />
            GitHub · Live
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          The official GitHub account behind THE WALL on Robinhood Chain.
        </p>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
              {GITHUB_BRAND}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{GITHUB_ACCOUNT}</div>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                github.com/{GITHUB_ACCOUNT}
              </a>
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--foreground)] text-[var(--bg)] text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {GITHUB_BRAND}
              Follow on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
