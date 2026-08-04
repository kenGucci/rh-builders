"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "wall-cookie-consent";

type Choice = "accepted" | "declined" | "pending";

export default function CookieConsent() {
  const [choice, setChoice] = useState<Choice>("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      setChoice(stored);
    } else {
      setChoice("pending");
    }
    setReady(true);
  }, []);

  const choose = (value: Choice) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setChoice(value);
  };

  if (!ready || choice !== "pending") return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-lg z-50 no-print"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
            <Cookie size={16} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">We use cookies</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
              THE WALL stores your preferences — theme, accent color, language, and assistant
              settings — so your choices persist between visits. See our{" "}
              <Link
                href="/legal/cookies"
                className="text-[var(--accent)] hover:underline"
                onClick={() => choose("declined")}
              >
                Cookie Policy
              </Link>{" "}
              to learn more.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => choose("accepted")}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Accept
              </button>
              <button
                onClick={() => choose("declined")}
                className="px-4 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
          <button
            onClick={() => choose("declined")}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors text-[var(--text-muted)]"
            aria-label="Dismiss cookie notice"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
