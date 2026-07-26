"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Users, MapPin, Calendar, Link as LinkIcon, Shield } from "lucide-react";

interface XProfile {
  displayName: string;
  avatar: string | null;
  description: string;
  followers: number | null;
  following: number | null;
  bannerUrl: string | null;
  joinDate: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  tweetCount: number | null;
}

function formatFollowers(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function TeamPage() {
  const [profile, setProfile] = useState<XProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/twitter?handle=suggestionii")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) {
          setError(true);
          setLoading(false);
          return;
        }
        setProfile({
          displayName: data.displayName || "suggestionii",
          avatar: data.avatarUrl || null,
          description: data.description || "",
          followers: data.followers,
          following: data.following,
          bannerUrl: data.bannerUrl || null,
          joinDate: data.joinDate || null,
          location: data.location || null,
          website: data.website || null,
          verified: data.verified || false,
          tweetCount: data.tweetCount,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          The people behind GAMBO RH
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-64 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
          <div className="h-48 rounded-2xl animate-shimmer" style={{ background: "var(--surface)" }} />
        </div>
      ) : error || !profile ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <div className="text-sm text-[var(--text-muted)]">Could not load X profile.</div>
          <a
            href="https://x.com/suggestionii"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            Visit @suggestionii on X
            <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <>
          {/* Profile Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* Banner */}
            <div className="h-40 sm:h-52 relative overflow-hidden">
              {profile.bannerUrl ? (
                <img
                  src={profile.bannerUrl}
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--accent)]/20 via-[var(--accent)]/5 to-transparent" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
            </div>

            {/* Avatar + Info */}
            <div className="px-6 pb-6 -mt-14 relative">
              <div className="flex items-end gap-4 mb-4">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-24 h-24 rounded-full border-4 border-[var(--surface)] object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--surface)] bg-gradient-to-br from-[var(--accent)] to-emerald-400 flex items-center justify-center shadow-lg">
                    <span className="text-black font-black text-2xl">S</span>
                  </div>
                )}
                <a
                  href="https://x.com/suggestionii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--bg)] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Follow on X
                </a>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.displayName}</h2>
                {profile.verified && (
                  <Shield size={16} className="text-[var(--accent)]" fill="currentColor" />
                )}
              </div>
              <div className="text-sm text-[var(--text-muted)] mb-3">@suggestionii</div>

              {profile.description && (
                <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4 max-w-lg">
                  {profile.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <Users size={18} className="mx-auto mb-2 text-[var(--accent)]" />
              <div className="text-xl font-bold">{formatFollowers(profile.followers)}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Followers</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <Users size={18} className="mx-auto mb-2 text-[var(--text-muted)]" />
              <div className="text-xl font-bold">{formatFollowers(profile.following)}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Following</div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-[var(--accent)]">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="text-xl font-bold">{formatFollowers(profile.tweetCount)}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Posts</div>
            </div>
          </div>

          {/* About */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-3">About</h3>
            <div className="space-y-3 text-sm text-[var(--text-muted)]">
              <p>
                Built GAMBO RH to bring full transparency to the Robinhood Chain ecosystem.
                Real-time builder analytics, KOL tracking, and on-chain data — all open-source.
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Robinhood Chain (4663) contributor
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Open-source builder tooling
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
