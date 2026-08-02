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
            <span className="text-xl font-bold gradient-text">THE WALL</span>
            <span className="text-sm text-[var(--text-muted)]">RH</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign In</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            Sign in with your email and password.
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

        {/* Footer */}
        <footer className="text-center space-y-1" role="contentinfo">
          <p className="text-xs text-[var(--text-muted)]">
            By signing in, you agree to our{" "}
            <a href="/legal/terms" className="text-[var(--accent)] hover:underline">Terms of Use</a>{" "}
            and{" "}
            <a href="/legal/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</a>
          </p>
          <p className="text-[11px] opacity-40">
            Secured with PBKDF2 hashing and JWT encryption. Data never leaves the server.
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
