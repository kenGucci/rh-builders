"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useI18n, languages } from "@/lib/i18n";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Users, Star,
  RefreshCw, ExternalLink, Clock, Globe, Scale,
} from "lucide-react";

const themes = [
  { name: "Green", accent: "#00c805", gradient: ["#00c805", "#00ff88"] },
  { name: "Red", accent: "#ef4444", gradient: ["#ef4444", "#f87171"] },
  { name: "Blue", accent: "#3b82f6", gradient: ["#3b82f6", "#60a5fa"] },
  { name: "Yellow", accent: "#eab308", gradient: ["#eab308", "#facc15"] },
  { name: "Purple", accent: "#a855f7", gradient: ["#a855f7", "#c084fc"] },
  { name: "Black", accent: "#71717a", gradient: ["#71717a", "#a1a1aa"] },
  { name: "Cyan", accent: "#06b6d4", gradient: ["#06b6d4", "#22d3ee"] },
  { name: "Pink", accent: "#ec4899", gradient: ["#ec4899", "#f472b6"] },
];

interface FeedbackEntry {
  id: string; name: string; email: string; twitter: string; wallet: string;
  role: "tester" | "user"; rating: "good" | "bad"; page: string;
  message: string; browser: string; createdAt: string;
}

interface FeedbackStats {
  total: number; good: number; bad: number; testers: number;
  users: number; uniqueNames: number;
  byPage: Record<string, { good: number; bad: number; total: number; pct: number }>;
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme(accent: string, gradient: string[]) {
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-dim", hexToRgba(accent, 0.08));
  root.style.setProperty("--accent-glow", hexToRgba(accent, 0.25));
  root.style.setProperty("--gradient-from", gradient[0]);
  root.style.setProperty("--gradient-to", gradient[1]);
}

const regions = [
  "All Regions",
  "North America",
  "South America",
  "Europe",
  "Asia",
  "Middle East",
  "Africa",
  "Oceania",
];

const regionMap: Record<string, string[]> = {
  "North America": ["en"],
  "South America": ["pt", "es"],
  "Europe": ["en", "de", "fr", "es", "it", "nl", "pl", "sv", "da", "fi", "no", "cs", "ro", "hu", "el", "bg", "hr", "sk", "lt", "lv", "et", "sl", "bs", "sq", "mk", "sr", "mt", "cy", "ga", "is", "lb", "ca", "eu", "gl", "uk", "ru"],
  "Asia": ["zh", "ja", "ko", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "ur", "fa", "th", "vi", "id", "ms", "tl", "my", "km", "si", "ne", "lo", "ka", "hy", "az", "uz", "kk", "mn", "tg", "tk", "ky"],
  "Middle East": ["ar", "he", "tr", "fa", "ur"],
  "Africa": ["sw", "ha", "yo", "ig", "zu", "af", "am"],
  "Oceania": ["en"],
};

export default function SettingsPage() {
  const { lang, setLang, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState("Green");
  const [detectedRegion, setDetectedRegion] = useState("");
  const [customColor, setCustomColor] = useState("#00c805");
  const [isCustom, setIsCustom] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [fbEntries, setFbEntries] = useState<FeedbackEntry[]>([]);
  const [fbStats, setFbStats] = useState<FeedbackStats | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbFilter, setFbFilter] = useState<"all" | "good" | "bad" | "tester" | "user">("all");
  const [showFbForm, setShowFbForm] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setFbLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFbEntries(data.entries || []);
      setFbStats(data.stats || null);
    } catch {} finally { setFbLoading(false); }
  }, []);

  useEffect(() => {
    fetchFeedback();
    const interval = setInterval(fetchFeedback, 30000);
    return () => clearInterval(interval);
  }, [fetchFeedback]);

  const fbFiltered = useMemo(() => {
    return fbEntries.filter((e) => {
      if (fbFilter === "good") return e.rating === "good";
      if (fbFilter === "bad") return e.rating === "bad";
      if (fbFilter === "tester") return e.role === "tester";
      if (fbFilter === "user") return e.role === "user";
      return true;
    });
  }, [fbEntries, fbFilter]);

  useEffect(() => {
    const navLang = navigator.language || "";
    setDetectedRegion(navLang);

    const saved = localStorage.getItem("thewallrh_theme");
    if (saved) {
      const found = themes.find((th) => th.name === saved);
      if (found) {
        setCurrentTheme(found.name);
        setCustomColor(found.accent);
        setIsCustom(false);
      }
    }
  }, []);

  const filteredLanguages = useMemo(() => {
    let list = languages;

    if (selectedRegion !== "All Regions") {
      const codes = regionMap[selectedRegion] || [];
      list = list.filter((l) => codes.includes(l.code));
    }

    return list;
  }, [selectedRegion]);

  const selectTheme = (theme: (typeof themes)[number]) => {
    setCurrentTheme(theme.name);
    setCustomColor(theme.accent);
    setIsCustom(false);
    applyTheme(theme.accent, theme.gradient);
    localStorage.setItem("thewallrh_theme", theme.name);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setIsCustom(true);
    const gradient = [color, color];
    applyTheme(color, gradient);
    localStorage.setItem("thewallrh_theme", color);
  };

  const previewTheme = isCustom
    ? { accent: customColor, gradient: [customColor, customColor] }
    : themes.find((th) => th.name === currentTheme) || themes[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t("settings.languageDesc")} &middot; {t("settings.themeDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <div>
              <h2 className="text-sm font-medium">{t("settings.language")}</h2>
              <p className="text-[10px] text-[var(--text-muted)]">{t("settings.languageDesc")}</p>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] mb-3">
            {t("settings.detectedRegion")}: <span className="text-[var(--text-secondary)]">{detectedRegion}</span>
          </div>

          {/* Region Filter */}
          <div className="flex flex-wrap gap-1 mb-3">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                  selectedRegion === r
                    ? "bg-[var(--accent)] text-black font-medium"
                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Language List */}
          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredLanguages.map((l) => (
              <label
                key={l.code}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  lang === l.code
                    ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                    : "border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={l.code}
                  checked={lang === l.code}
                  onChange={() => setLang(l.code)}
                  className="sr-only"
                />
                <span className="text-lg w-7 text-center">{l.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.nativeName}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{l.name} — {l.region}</div>
                </div>
                {lang === l.code && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--accent)] flex-shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </label>
            ))}
            {filteredLanguages.length === 0 && (
              <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                No languages found
              </div>
            )}
          </div>

          <div className="text-[10px] text-[var(--text-muted)] mt-2 text-center">
            {filteredLanguages.length} of {languages.length} languages
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <div>
              <h2 className="text-sm font-medium">{t("settings.theme")}</h2>
              <p className="text-[10px] text-[var(--text-muted)]">{t("settings.themeDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => selectTheme(theme)}
                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all ${
                  currentTheme === theme.name && !isCustom
                    ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                    : "border-[var(--border)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-white/10"
                  style={{ background: theme.accent }}
                />
                <span className="text-[10px] text-[var(--text-secondary)]">{theme.name}</span>
                {currentTheme === theme.name && !isCustom && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="absolute top-1 right-1 text-[var(--accent)]">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="mb-5">
            <label className="text-[11px] text-[var(--text-muted)] mb-1.5 block">{t("settings.customColor")}</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                />
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-mono">{customColor}</span>
              {isCustom && (
                <span className="text-[10px] text-[var(--accent)] bg-[var(--accent-dim)] px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="text-[11px] text-[var(--text-muted)] mb-2">{t("settings.livePreview")}</div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-300"
                  style={{ background: previewTheme.accent }}
                >
                  <span className="text-black font-bold text-[6px] leading-none">W</span>
                </div>
                <div>
                  <div className="text-[11px] font-medium">{t("settings.previewTitle")}</div>
                  <div className="text-[8px] text-[var(--text-muted)]">{t("settings.previewSubtitle")}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-muted)]">{t("settings.previewBalance")}</div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full transition-colors duration-300" style={{ background: previewTheme.accent }} />
                  <span className="text-[9px] text-[var(--text-muted)]">{t("settings.previewStatus")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={18} className="text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-medium">Feedback</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Track what people think and what needs fixing.</p>
            </div>
          </div>
          <button onClick={() => setShowFbForm(!showFbForm)}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:shadow-[0_0_20px_var(--accent-glow)] transition-all">
            {showFbForm ? "Close" : "+ Add Feedback"}
          </button>
        </div>

        {showFbForm && <FeedbackForm onSubmit={() => { setShowFbForm(false); fetchFeedback(); }} />}

        {fbStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <FbStat label="Total" value={fbStats.total} icon={<MessageSquare size={14} />} />
            <FbStat label="Good" value={fbStats.good} icon={<ThumbsUp size={14} />} color="green" />
            <FbStat label="Bad" value={fbStats.bad} icon={<ThumbsDown size={14} />} color="red" />
            <FbStat label="Testers" value={fbStats.testers} icon={<Star size={14} />} color="yellow" />
            <FbStat label="People" value={fbStats.uniqueNames} icon={<Users size={14} />} color="blue" />
          </div>
        )}

        {fbStats && Object.keys(fbStats.byPage).length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={12} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold">By Page</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(fbStats.byPage)
                .sort((a, b) => (b[1].good + b[1].bad) - (a[1].good + a[1].bad))
                .map(([page, counts]) => (
                  <div key={page} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] font-medium truncate">{page}</div>
                    <div className="flex items-center gap-2 text-[8px] mt-0.5">
                      <span className="text-green-400">{counts.good}g</span>
                      <span className="text-red-400">{counts.bad}b</span>
                      <span className="text-[var(--accent)] font-semibold">{counts.pct}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {(["all", "good", "bad", "tester", "user"] as const).map((f) => (
                <button key={f} onClick={() => setFbFilter(f)}
                  className={`px-2 py-0.5 rounded text-[9px] transition-all capitalize ${
                    fbFilter === f ? "bg-[var(--accent)] text-black font-medium" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
                  }`}>{f}</button>
              ))}
            </div>
            <button onClick={fetchFeedback} className="p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]">
              <RefreshCw size={10} className={fbLoading ? "animate-spin" : ""} />
            </button>
          </div>

        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {fbLoading && fbEntries.length === 0 ? (
            [1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-shimmer" style={{ background: "var(--bg-card)" }} />)
          ) : fbFiltered.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-[var(--text-muted)]">{fbEntries.length === 0 ? "No feedback yet." : "No matches."}</div>
          ) : fbFiltered.map((entry) => (
            <div key={entry.id} className={`p-3 rounded-xl border ${entry.rating === "good" ? "border-green-500/20" : "border-red-500/20"}`}>
              <div className="flex items-start gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  entry.rating === "good" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>{entry.rating === "good" ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{entry.name}</span>
                    {entry.role === "tester" && <span className="text-[7px] px-1 rounded bg-yellow-500/10 text-yellow-400">Tester</span>}
                    {entry.page && <span className="text-[7px] px-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">{entry.page}</span>}
                  </div>
                  {entry.message && <p className="text-[10px] text-[var(--text-secondary)] mt-1">{entry.message}</p>}
                  <div className="flex items-center gap-2 mt-1 text-[8px] text-[var(--text-muted)]">
                    <Clock size={7} />{timeAgo(entry.createdAt)}{entry.twitter && <> · @{entry.twitter}</>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Scale size={18} className="text-[var(--accent)]" />
          <div>
            <h2 className="text-sm font-medium">Legal</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Terms, cookies, and privacy — all live and up to date.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/legal/terms", title: "Terms of Use", desc: "The rules for using THE WALL" },
            { href: "/legal/cookies", title: "Cookie Policy", desc: "How cookies and storage are used" },
            { href: "/legal/privacy", title: "Privacy Policy", desc: "What information we collect" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 hover:shadow-[0_0_16px_var(--accent-glow)] transition-all"
            >
              <div className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5">
                {l.title}
                <ExternalLink size={10} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{l.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
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
    setLoading(true); setError("");
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
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3 mb-4 fade-in">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
        <MessageSquare size={12} /> Submit Feedback
      </div>
      {error && <div className="p-2 rounded-lg bg-red-500/10 text-[10px] text-red-400">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Name *"
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" />
        <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X / Twitter"
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" />
        <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="Wallet"
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] font-mono focus:border-[var(--accent)]/50 transition-all" />
      </div>
      <div className="flex gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value as "tester" | "user")}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50">
          <option value="user">User</option>
          <option value="tester">Tester</option>
        </select>
        <div className="flex gap-1">
          <button type="button" onClick={() => setRating("good")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${rating === "good" ? "bg-green-500/20 border border-green-500/40 text-green-400" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"}`}>
            <ThumbsUp size={10} className="inline" /> Good
          </button>
          <button type="button" onClick={() => setRating("bad")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${rating === "bad" ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]"}`}>
            <ThumbsDown size={10} className="inline" /> Bad
          </button>
        </div>
        <input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page"
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all" />
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="What did you think?"
        className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--foreground)] focus:border-[var(--accent)]/50 transition-all resize-none" />
      <button type="submit" disabled={!name || !rating || loading}
        className="w-full py-2 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:shadow-[0_0_20px_var(--accent-glow)] transition-all disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

function FbStat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green-400 border-green-400/20",
    red: "text-red-400 border-red-400/20",
    yellow: "text-yellow-400 border-yellow-400/20",
    blue: "text-blue-400 border-blue-400/20",
  };
  const c = colorMap[color || ""] || "text-[var(--accent)] border-[var(--accent)]/20";
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2.5 text-center">
      <div className={`flex items-center justify-center gap-1 ${c} mb-0.5`}>
        {icon}
        <span className="text-[8px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-bold gradient-text">{value}</div>
    </div>
  );
}
