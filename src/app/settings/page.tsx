"use client";

import { useState, useEffect, useMemo } from "react";
import { useI18n, languages, type Language } from "@/lib/i18n";

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

  document.querySelectorAll<HTMLElement>(".gradient-text").forEach((el) => {
    el.style.background = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
    el.style.webkitBackgroundClip = "text";
    el.style.webkitTextFillColor = "transparent";
    el.style.backgroundClip = "text";
  });
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
  const [langSearch, setLangSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

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

    if (langSearch.trim()) {
      const q = langSearch.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.region.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [langSearch, selectedRegion]);

  const selectTheme = (theme: (typeof themes)[number]) => {
    setCurrentTheme(theme.name);
    setCustomColor(theme.accent);
    setIsCustom(false);
    applyTheme(theme.accent, theme.gradient);
    localStorage.setItem("thewallrh_theme", theme.name);
  };

  const selectCustom = () => {
    setIsCustom(true);
    setCurrentTheme("");
    const gradient = [customColor, customColor];
    applyTheme(customColor, gradient);
    localStorage.setItem("thewallrh_theme", customColor);
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

          {/* Search */}
          <div className="relative mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder={t("settings.searchLang")}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 transition-all"
            />
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
    </div>
  );
}
