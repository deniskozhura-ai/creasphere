-- =========================================================================
-- Migration: Add admin_login column to admin_sessions and create admin_login_attempts
-- =========================================================================

-- 1. Create or update admin_sessions with admin_login column
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  admin_login TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.admin_sessions ADD COLUMN IF NOT EXISTS admin_login TEXT;

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_sessions TO service_role;

-- 2. Create admin_login_attempts for brute-force rate limiting
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip VARCHAR(100) NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_login_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_login_attempts TO service_role;

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time ON public.admin_login_attempts(ip, attempted_at DESC);
