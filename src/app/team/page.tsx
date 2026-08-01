"use client";

import { useState, useEffect } from "react";
import { ExternalLink, MapPin, Calendar, Link as LinkIcon, Shield } from "lucide-react";

const X_BRAND = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface XProfile {
  displayName: string;
  avatar: string | null;
  description: string;
  bannerUrl: string | null;
  joinDate: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  followers: number | null;
  following: number | null;
}

const OFFICIAL_HANDLE = "officialWALLrh";
const LEAD_HANDLE = "suggestionii";

function fetchProfile(handle: string): Promise<XProfile> {
  return fetch(`/api/twitter?handle=${handle}`)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((data) => {
      if (!data || data.error) throw new Error();
      return {
        displayName: data.displayName || handle,
        avatar: data.avatarUrl || null,
        description: data.description || "",
        bannerUrl: data.bannerUrl || null,
        joinDate: data.joinDate || null,
        location: data.location || null,
        website: data.website || null,
        verified: data.verified || false,
        followers: data.followers ?? null,
        following: data.following ?? null,
      };
    });
}

function formatFollowers(n: number | null): string {
  if (!n) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function XProfileCard({
  handle,
  official,
}: {
  handle: string;
  official?: boolean;
}) {
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfile(handle)
      .then((p) => { if (active) { setProfile(p); setLoading(false); } })
      .catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [handle]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-40 sm:h-48 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
        <div className="h-24 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
        <div className="text-sm text-[var(--text-muted)]">Could not load X profile.</div>
        <a
          href={`https://x.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm text-[var(--accent)] hover:underline"
        >
          Visit @{handle} on X
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className={`relative overflow-hidden ${official ? "h-44 sm:h-56" : "h-40 sm:h-52"}`}>
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent)]/25 via-[var(--accent)]/5 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        {official && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent)] text-black text-[9px] font-bold uppercase tracking-wider shadow-lg">
            <Shield size={11} fill="currentColor" />
            Official X
          </span>
        )}
      </div>

      {/* Avatar + Info */}
      <div className={`px-6 pb-6 -mt-14 relative`}>
        <div className="flex items-end gap-4 mb-4">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className={`rounded-full border-4 border-[var(--surface)] object-cover shadow-lg ${official ? "w-28 h-28" : "w-24 h-24"}`}
            />
          ) : (
            <div className={`rounded-full border-4 border-[var(--surface)] bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center shadow-lg ${official ? "w-28 h-28" : "w-24 h-24"}`}>
              <span className="text-black font-black text-2xl">{profile.displayName.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-auto px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 ${
              official ? "bg-[var(--accent)] text-black shadow-[0_0_20px_var(--accent-glow)]" : "bg-[var(--foreground)] text-[var(--bg)]"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow on X
          </a>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h2 className={`font-bold ${official ? "text-2xl" : "text-xl"}`}>{profile.displayName}</h2>
          {profile.verified && (
            <Shield size={16} className="text-[var(--accent)]" fill="currentColor" />
          )}
        </div>
        <div className="text-sm text-[var(--text-muted)] mb-3">@{handle}</div>

        {profile.description && profile.description.includes("followers") ? (
          <p className="text-xs text-[var(--text-muted)] mb-3 max-w-xl">
            The official account of THE WALL — real-time analytics for Robinhood Chain, 24/7 market news, live on-chain data, and Stock Tokens.
          </p>
        ) : profile.description ? (
          <p className="text-xs text-[var(--text-muted)] mb-3 max-w-xl">{profile.description}</p>
        ) : null}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--foreground)]">{formatFollowers(profile.followers)}</span> Followers
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--foreground)]">{formatFollowers(profile.following)}</span> Following
          </span>
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[var(--accent)] hover:underline"
            >
              <LinkIcon size={12} />
              {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
          {profile.joinDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              Joined {profile.joinDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="space-y-10 fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          The people and official channels behind THE WALL
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

      {/* Team Members */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Team Members</h2>
        </div>
        <XProfileCard handle={LEAD_HANDLE} />
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-xs text-[var(--text-muted)] leading-relaxed">
          THE WALL is built by a small, focused team passionate about Robinhood Chain and decentralized ecosystems.
          Follow{" "}
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
