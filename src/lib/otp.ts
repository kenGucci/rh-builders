import { randomBytes } from "crypto";

interface OTPEntry {
  code: string;
  email: string;
  createdAt: number;
  attempts: number;
}

const OTP_TTL = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;
const otpStore = new Map<string, OTPEntry>();
const rateLimitStore = new Map<string, number>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of otpStore) {
    if (now - entry.createdAt > OTP_TTL) otpStore.delete(key);
  }
  for (const [key, ts] of rateLimitStore) {
    if (now - ts > RATE_LIMIT_WINDOW) rateLimitStore.delete(key);
  }
}

export function generateOTP(email: string): string | { error: string } {
  cleanup();

  const normalised = email.toLowerCase().trim();
  const lastSent = rateLimitStore.get(normalised);
  const now = Date.now();

  if (lastSent && now - lastSent < RATE_LIMIT_WINDOW) {
    const waitSec = Math.ceil((RATE_LIMIT_WINDOW - (now - lastSent)) / 1000);
    return { error: `Please wait ${waitSec}s before requesting another code` };
  }

  const code = randomBytes(3).readUIntBE(0, 3).toString().padStart(6, "0").slice(0, 6);

  otpStore.set(normalised, {
    code,
    email: normalised,
    createdAt: now,
    attempts: 0,
  });

  rateLimitStore.set(normalised, now);

  return code;
}

export function verifyOTP(email: string, code: string): { ok: true } | { error: string } {
  cleanup();

  const normalised = email.toLowerCase().trim();
  const entry = otpStore.get(normalised);

  if (!entry) {
    return { error: "No verification code found. Please request a new one." };
  }

  if (Date.now() - entry.createdAt > OTP_TTL) {
    otpStore.delete(normalised);
    return { error: "Code expired. Please request a new one." };
  }

  entry.attempts++;
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normalised);
    return { error: "Too many failed attempts. Please request a new code." };
  }

  if (entry.code !== code.trim()) {
    return { error: `Invalid code. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
  }

  otpStore.delete(normalised);
  return { ok: true };
}
