"use client";

import { useState, useEffect } from "react";

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

const darkVars: Record<string, string> = {
  "--bg": "#06080a",
  "--bg-card": "#0c1014",
  "--bg-card-hover": "#12171c",
  "--bg-elevated": "#181e25",
  "--border": "#1c2229",
  "--border-subtle": "#12171c",
  "--text": "#e8eaed",
  "--text-secondary": "#8b9198",
  "--text-muted": "#4a5058",
  "--foreground": "#e8eaed",
  "--surface": "#0c1014",
  "--muted": "#4a5058",
};

const lightVars: Record<string, string> = {
  "--bg": "#f8f9fa",
  "--bg-card": "#ffffff",
  "--bg-card-hover": "#f1f3f5",
  "--bg-elevated": "#e9ecef",
  "--border": "#dee2e6",
  "--border-subtle": "#e9ecef",
  "--text": "#1a1a2e",
  "--text-secondary": "#495057",
  "--text-muted": "#868e96",
  "--foreground": "#1a1a2e",
  "--surface": "#ffffff",
  "--muted": "#868e96",
};

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

function applyColorMode(mode: "dark" | "light") {
  const root = document.documentElement;
  const vars = mode === "dark" ? darkVars : lightVars;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}

export default function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const [current, setCurrent] = useState("Green");
  const [open, setOpen] = useState(false);
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("gambo_theme");
    if (savedTheme) {
      const found = themes.find((t) => t.name === savedTheme);
      if (found) {
        setCurrent(found.name);
        applyTheme(found.accent, found.gradient);
      }
    }
    const savedMode = localStorage.getItem("gambo_color_mode") as "dark" | "light" | null;
    if (savedMode) {
      setColorMode(savedMode);
      applyColorMode(savedMode);
    }
  }, []);

  const select = (theme: (typeof themes)[number]) => {
    setCurrent(theme.name);
    applyTheme(theme.accent, theme.gradient);
    localStorage.setItem("gambo_theme", theme.name);
    setOpen(false);
  };

  const toggleColorMode = () => {
    const next = colorMode === "dark" ? "light" : "dark";
    setColorMode(next);
    applyColorMode(next);
    localStorage.setItem("gambo_color_mode", next);
    // Re-apply accent theme after mode change
    const found = themes.find((t) => t.name === current);
    if (found) {
      setTimeout(() => applyTheme(found.accent, found.gradient), 50);
    }
  };

  const currentTheme = themes.find((t) => t.name === current) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)]/30 transition-colors ${compact ? "" : "w-full"}`}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
          style={{ background: currentTheme.accent }}
        />
        {compact ? "" : "Theme"}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-2 shadow-xl min-w-[180px] fade-in">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleColorMode}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all mb-1 bg-[var(--bg-elevated)]"
            >
              {colorMode === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                  <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              <span className="text-[var(--text-secondary)]">{colorMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <div className="h-px bg-[var(--border)] mx-2 mb-1" />
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => select(theme)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  current === theme.name
                    ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ background: theme.accent }}
                />
                {theme.name}
                {current === theme.name && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="ml-auto"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
