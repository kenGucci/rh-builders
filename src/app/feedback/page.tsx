"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Users, Star,
  RefreshCw, Search, Filter, ExternalLink, Clock, Globe,
} from "lucide-react";

interface FeedbackEntry {
  id: string;
  name: string;
  email: string;
  twitter: string;
  wallet: string;
  role: "tester" | "user";
  rating: "good" | "bad";
  page: string;
  message: string;
  browser: string;
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  good: number;
  bad: number;
  testers: number;
  users: number;
  uniqueNames: number;
  byPage: Record<string, { good: number; bad: number }>;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function FeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "good" | "bad" | "tester" | "user">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = entries.filter((e) => {
    if (filter === "good") return e.rating === "good";
    if (filter === "bad") return e.rating === "bad";
    if (filter === "tester") return e.role === "tester";
    if (filter === "user") return e.role === "user";
    return true;
  }).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.name, e.email, e.twitter, e.message, e.page].some((f) => f?.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <MessageSquare size={20} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Feedback & Testers</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track who&apos;s tested the site, what they think, and what needs fixing.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:shadow-[0_0_20px_var(--accent-glow)] transition-all"
        >
          {showForm ? "Close" : "+ Add Feedback"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total Entries" value={stats.total} icon={<MessageSquare size={14} />} />
          <StatCard label="Good" value={stats.good} icon={<ThumbsUp size={14} />} color="green" />
          <StatCard label="Bad" value={stats.bad} icon={<ThumbsDown size={14} />} color="red" />
          <StatCard label="Testers" value={stats.testers} icon={<Star size={14} />} color="yellow" />
          <StatCard label="Unique People" value={stats.uniqueNames} icon={<Users size={14} />} color="blue" />
        </div>
      )}

      {/* Page Breakdown */}
      {stats && Object.keys(stats.byPage).length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold">Feedback by Page</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(stats.byPage)
              .sort((a, b) => (b[1].good + b[1].bad) - (a[1].good + a[1].bad))
              .map(([page, counts]) => (
                <div key={page} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2">
                  <div className="text-xs font-medium truncate">{page}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span className="text-green-400">{counts.good} good</span>
                    <span className="text-red-400">{counts.bad} bad</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showForm && <FeedbackForm onSubmit={() => { setShowForm(false); fetchData(); }} />}

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-[var(--text-muted)]" />
          {(["all", "good", "bad", "tester", "user"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all capitalize ${
                filter === f
                  ? "bg-[var(--accent)] text-black font-medium"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, message..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 transition-all"
          />
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Entries List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ background: "var(--surface)" }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {entries.length === 0 ? "No feedback yet. Be the first!" : "No entries match your filter."}
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className={`bg-[var(--surface)] border rounded-xl p-4 transition-all ${
                entry.rating === "good"
                  ? "border-green-500/20 hover:border-green-500/30"
                  : "border-red-500/20 hover:border-red-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  entry.rating === "good"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {entry.rating === "good" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{entry.name}</span>
                    {entry.role === "tester" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Tester</span>
                    )}
                    {entry.twitter && (
                      <a
                        href={`https://x.com/${entry.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#1DA1F2] hover:underline flex items-center gap-0.5"
                      >
                        @{entry.twitter} <ExternalLink size={8} />
                      </a>
                    )}
                    {entry.page && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">{entry.page}</span>
                    )}
                  </div>
                  {entry.message && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{entry.message}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(entry.createdAt)}</span>
                    {entry.email && <span>{entry.email}</span>}
                    {entry.wallet && (
                      <a
                        href={`https://robinhoodchain.blockscout.com/address/${entry.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline font-mono"
                      >
                        {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                      </a>
                    )}
                    {entry.browser && <span>{entry.browser}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-green-400 border-green-400/20",
    red: "text-red-400 border-red-400/20",
    yellow: "text-yellow-400 border-yellow-400/20",
    blue: "text-blue-400 border-blue-400/20",
  };
  const c = colorMap[color || ""] || "text-[var(--accent)] border-[var(--accent)]/20";

  return (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-center`}>
      <div className={`flex items-center justify-center gap-1.5 ${c} mb-1`}>
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold gradient-text">{value}</div>
    </div>
  );
}

function FeedbackForm({ onSubmit }: { onSubmit: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [twitter, setTwitter] = useState("");
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState<"tester" | "user">("user");
  const [rating, setRating] = useState<"good" | "bad" | "">("");
  const [page, setPage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rating) { setError("Name and rating required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, twitter, wallet, role, rating,
          page: page || "general", message,
          browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });
      if (!res.ok) { setError("Failed to submit"); return; }
      onSubmit();
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4 fade-in">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={14} className="text-[var(--accent)]" />
        <span className="text-sm font-semibold">Submit Feedback</span>
      </div>

      {error && <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">X / Twitter</label>
          <input value={twitter} onChange={(e) => setTwitter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" placeholder="@handle" />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Wallet Address</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] font-mono focus:border-[var(--accent)]/50 transition-all" placeholder="0x..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as "tester" | "user")}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all">
            <option value="user">User</option>
            <option value="tester">Tester</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Rating *</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRating("good")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                rating === "good" ? "bg-green-500/20 border border-green-500/40 text-green-400" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
              }`}>
              <ThumbsUp size={12} /> Good
            </button>
            <button type="button" onClick={() => setRating("bad")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                rating === "bad" ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
              }`}>
              <ThumbsDown size={12} /> Bad
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-[var(--text-muted)] mb-1">Page / Feature</label>
          <input value={page} onChange={(e) => setPage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" placeholder="e.g. /builder, /market" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all resize-none" placeholder="What did you think? What needs fixing?" />
      </div>

      <button type="submit" disabled={!name || !rating || loading}
        className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:shadow-[0_0_20px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
