CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  username_updated_at TIMESTAMPTZ,
  birthday DATE,
  gender VARCHAR(24),
  gender_locked_at TIMESTAMPTZ,
  bio VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_gender_allowed CHECK (
    gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  CONSTRAINT user_profiles_gender_lock_consistent CHECK (
    (gender IS NULL AND gender_locked_at IS NULL)
    OR (gender IS NOT NULL AND gender_locked_at IS NOT NULL)
  ),
  CONSTRAINT user_profiles_bio_length CHECK (
    bio IS NULL OR char_length(bio) <= 30
  )
);

INSERT INTO user_profiles (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_profiles IS 'Private profile data owned one-to-one by users.id. Authentication username remains canonical in users.username.';
