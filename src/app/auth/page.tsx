"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("from") || "/";

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) router.push(redirectTo);
      })
      .catch(() => {});
  }, [router, redirectTo]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <main className="fade-in w-full max-w-lg space-y-8" role="main" aria-label="Authentication">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <span className="text-xl font-bold gradient-text">GAMBO</span>
            <span className="text-sm text-[var(--text-muted)]">RH</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign In</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            Sign in with your email and password, or continue with X.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Password Login */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="pw-email" className="block text-xs text-[var(--text-muted)] mb-1.5">Email Address</label>
            <input
              id="pw-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:shadow-[0_0_12px_var(--accent-glow)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="pw-password" className="block text-xs text-[var(--text-muted)] mb-1.5">Password</label>
            <input
              id="pw-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:shadow-[0_0_12px_var(--accent-glow)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:shadow-[0_0_20px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center" role="separator">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="px-3 text-xs text-[var(--text-muted)]">or</span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        {/* X Login */}
        <a
          href="/api/auth/x/login"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#000] border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Continue with X (Twitter)
        </a>

        {/* Footer */}
        <footer className="text-center space-y-1" role="contentinfo">
          <p className="text-xs text-[var(--text-muted)]">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-[11px] opacity-40">
            Secured with PBKDF2 hashing, JWT encryption, and OAuth 2.0 PKCE. Data never leaves the server.
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
