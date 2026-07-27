-- ============================================================
-- GAMBO RH — Supabase Schema
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

-- Row Level Security (RLS) — disabled for now since we use service role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow anon read access (optional — remove if you want strict RLS)
CREATE POLICY "Allow anon read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow anon read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon delete sessions" ON sessions FOR DELETE USING (true);

CREATE POLICY "Allow anon read feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow anon insert feedback" ON feedback FOR INSERT WITH CHECK (true);
