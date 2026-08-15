UPDATE users
SET username = 'user_' || REPLACE(id::text, '-', '')
WHERE username IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;

CREATE TABLE IF NOT EXISTS user_data (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data_key VARCHAR(64) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, data_key),
  CONSTRAINT user_data_key_allowed CHECK (
    data_key IN ('tasks', 'daily_stats', 'reflections', 'preferences', 'checkins')
  ),
  CONSTRAINT user_data_size_limit CHECK (octet_length(data::text) <= 1048576)
);

CREATE INDEX IF NOT EXISTS user_data_updated_at_idx ON user_data (user_id, updated_at DESC);

COMMENT ON TABLE user_data IS 'Account-owned synchronized application data. Every read and write is scoped by authenticated user_id.';
