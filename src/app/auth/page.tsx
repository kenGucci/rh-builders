"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthView = "otp-email" | "otp-verify" | "password" | "methods";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<AuthView>("otp-email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }
      setOtpSent(true);
      setView("otp-verify");
      setOtpCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setLoading(true);
    const code = otpCode.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newCode.every((d) => d) && newCode.join("").length === 6) {
      setTimeout(() => handleVerifyOTP(), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtpCode(newCode);
    const nextEmpty = newCode.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {view === "otp-email" && "Sign In to GAMBO RH"}
            {view === "otp-verify" && "Check Your Inbox"}
            {view === "password" && "Sign In with Password"}
            {view === "methods" && "All Sign-In Methods"}
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            {view === "otp-email" && "Enter your email and we&apos;ll send a verification code. No password needed."}
            {view === "otp-verify" && `Code sent to ${email}. Enter the 6-digit code below.`}
            {view === "password" && "Sign in with your registered email and password."}
            {view === "methods" && "Choose your preferred sign-in method."}
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* ── VIEW: OTP Email Input (DEFAULT) ── */}
        {view === "otp-email" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="otp-email-input" className="block text-xs text-[var(--text-muted)] mb-1.5">Email Address</label>
              <input
                id="otp-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && handleSendOTP()}
                placeholder="your@email.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:shadow-[0_0_12px_var(--accent-glow)] transition-all"
              />
            </div>

            <div>
              <label htmlFor="otp-name-input" className="block text-xs text-[var(--text-muted)] mb-1.5">
                Display Name <span className="opacity-50">(optional for new accounts)</span>
              </label>
              <input
                id="otp-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && handleSendOTP()}
                placeholder="How should we call you?"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:shadow-[0_0_12px_var(--accent-glow)] transition-all"
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={!email || loading}
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:shadow-[0_0_20px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>

            <div className="relative flex items-center" role="separator">
              <div className="flex-1 border-t border-[var(--border)]" />
              <span className="px-3 text-xs text-[var(--text-muted)]">or</span>
              <div className="flex-1 border-t border-[var(--border)]" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setView("password"); setError(""); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Password
              </button>
              <a
                href="/api/auth/x/login"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000] border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </a>
            </div>
          </div>
        )}

        {/* ── VIEW: OTP Verify ── */}
        {view === "otp-verify" && (
          <div className="space-y-5">
            <div className="flex justify-center gap-2.5">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_12px_var(--accent-glow)] transition-all outline-none"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={otpCode.join("").length !== 6 || loading}
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:shadow-[0_0_20px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <div className="text-center">
              {otpCooldown > 0 ? (
                <span className="text-xs text-[var(--text-muted)]">Resend code in {otpCooldown}s</span>
              ) : (
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>

            <button onClick={() => { setView("otp-email"); setOtpCode(["", "", "", "", "", ""]); setError(""); }} className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              ← Use a different email
            </button>
          </div>
        )}

        {/* ── VIEW: Password Login ── */}
        {view === "password" && (
          <div className="space-y-4">
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

            <button onClick={() => { setView("otp-email"); setError(""); }} className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
              ← Sign in with email code instead
            </button>
          </div>
        )}

        {/* ── VIEW: All Methods ── */}
        {view === "methods" && (
          <div className="space-y-3">
            <a
              href="/api/auth/x/login"
              className="group flex items-center gap-4 w-full px-6 py-5 rounded-xl bg-[#000] border-2 border-white/10 text-white font-semibold text-sm hover:border-[var(--accent)]/40 hover:shadow-[0_0_30px_var(--accent-glow)] transition-all cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="text-base">Continue with X</span>
                <span className="text-xs text-white/50 font-normal">OAuth 2.0 — secure one-click sign-in</span>
              </div>
            </a>

            <button
              onClick={() => { setView("otp-email"); setError(""); }}
              className="group flex items-center gap-4 w-full px-6 py-5 rounded-xl bg-[var(--surface)] border-2 border-[var(--accent)]/30 text-[var(--foreground)] font-semibold text-sm hover:border-[var(--accent)]/50 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all cursor-pointer"
            >
              <div className="w-[22px] h-[22px] rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">Continue with Email Code</span>
                <span className="text-xs text-[var(--text-muted)] font-normal">We&apos;ll send a 6-digit code — no password required</span>
              </div>
            </button>

            <button
              onClick={() => { setView("password"); setError(""); }}
              className="group flex items-center gap-4 w-full px-6 py-5 rounded-xl bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:border-[var(--accent)]/40 hover:shadow-[0_0_20px_var(--accent-glow)] transition-all cursor-pointer"
            >
              <div className="w-[22px] h-[22px] rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">Continue with Password</span>
                <span className="text-xs text-[var(--text-muted)] font-normal">Sign in with your email and password</span>
              </div>
            </button>

            <button onClick={() => { setView("otp-email"); setError(""); }} className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors pt-2">
              ← Back
            </button>
          </div>
        )}

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
