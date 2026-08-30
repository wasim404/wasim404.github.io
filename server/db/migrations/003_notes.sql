CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notes_content_required CHECK (
    char_length(BTRIM(content)) BETWEEN 1 AND 10000
  )
);

CREATE INDEX IF NOT EXISTS notes_user_created_at_idx
  ON notes (user_id, created_at DESC);

COMMENT ON TABLE notes IS 'Account-owned quick notes. Every query must be scoped by authenticated user_id.';
