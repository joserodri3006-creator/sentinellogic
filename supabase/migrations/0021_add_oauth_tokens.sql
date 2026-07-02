-- Add OAuth token storage for Google Drive
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);

-- Enable RLS
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tokens"
  ON google_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON google_oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON google_oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
