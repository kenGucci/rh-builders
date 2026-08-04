"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const redirectTo = searchParams.get("from") || "/";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) router.push(redirectTo);
      })
      .catch(() => {});
  }, [router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <main className="fade-in w-full max-w-md space-y-8" role="main" aria-label="Sign in">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span className="text-xl font-bold gradient-text">THE WALL</span>
            <span className="text-sm text-[var(--text-muted)]">RH</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign in to continue</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            THE WALL RH is a private community. Connect your X account to unlock the full site.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Continue with X */}
        <a
          href={`/api/auth/x?from=${encodeURIComponent(redirectTo)}`}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-black border border-[var(--border)] text-sm font-semibold text-white hover:border-white/40 transition-all"
        >
          <span className="text-base leading-none" aria-hidden="true">𝕏</span>
          Continue with X
        </a>

        {/* Footer */}
        <footer className="text-center space-y-1" role="contentinfo">
          <p className="text-xs text-[var(--text-muted)]">
            By continuing, you agree to our{" "}
            <a href="/legal/terms" className="text-[var(--accent)] hover:underline">Terms of Use</a>{" "}
            and{" "}
            <a href="/legal/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="text-sm text-[var(--text-muted)]">Loading...</div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
