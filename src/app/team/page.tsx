"use client";

import { useState, useEffect } from "react";
import { ExternalLink, MapPin, Calendar, Link as LinkIcon, Shield } from "lucide-react";

interface XProfile {
  displayName: string;
  avatar: string | null;
  description: string;
  bannerUrl: string | null;
  joinDate: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
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
          bannerUrl: data.bannerUrl || null,
          joinDate: data.joinDate || null,
          location: data.location || null,
          website: data.website || null,
          verified: data.verified || false,
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
          The people behind THE WALL
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


        </>
      )}
    </div>
  );
}
