CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50),
  password_hash TEXT NOT NULL,
  email VARCHAR(320),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone VARCHAR(32),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_identity_required CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CONSTRAINT users_verified_email_requires_value CHECK (NOT email_verified OR email IS NOT NULL),
  CONSTRAINT users_verified_phone_requires_value CHECK (NOT phone_verified OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON users (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
  ON users (LOWER(username)) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('email_verify', 'email_bind', 'phone_verify')),
  target VARCHAR(320) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_codes_lookup_idx
  ON verification_codes (type, target, created_at DESC);
CREATE INDEX IF NOT EXISTS verification_codes_user_id_idx
  ON verification_codes (user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE users IS 'Authentication owner; future tasks, schedules and focus_records reference users.id';
