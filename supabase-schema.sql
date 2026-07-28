-- ============================================================
-- THE WALL RH — Supabase Schema
-- Run this in the Supabase SQL Editor to set up tables
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'x')),
  x_handle TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Sessions table (optional — for tracking active sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  twitter TEXT DEFAULT '',
  wallet TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('tester', 'user')),
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad')),
  page TEXT DEFAULT '',
  message TEXT NOT NULL,
  browser TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Drop the old permissive policies first
DROP POLICY IF EXISTS "Allow anon read users" ON users;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon update users" ON users;
DROP POLICY IF EXISTS "Allow anon read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon delete sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon read feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anon insert feedback" ON feedback;

-- ============================================================
-- New restrictive policies
-- ============================================================

-- Users: NO anon access (server uses service_role key which bypasses RLS)
-- All user operations must go through server-side code with service_role

-- Sessions: NO anon access (server uses service_role key which bypasses RLS)

-- Feedback: Allow anon INSERT only (public form submissions)
-- No SELECT/UPDATE/DELETE for anon — only service_role can read/manage
CREATE POLICY "Allow anon insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- How to apply:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. IMPORTANT: Also set the SUPABASE_SERVICE_ROLE_KEY env var
--    (Dashboard > Settings > API > service_role key)
-- ============================================================
