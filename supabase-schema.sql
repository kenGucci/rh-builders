-- ============================================================
-- THE WALL RH — Supabase Schema
-- Run this in the Supabase SQL Editor to set up tables
-- ============================================================

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
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Drop the old permissive policies first
DROP POLICY IF EXISTS "Allow anon insert feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anon read feedback" ON feedback;

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
