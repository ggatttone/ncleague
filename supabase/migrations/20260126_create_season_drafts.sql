-- Create season_drafts table for wizard draft persistence
CREATE TABLE season_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  current_step INTEGER DEFAULT 1,
  draft_data JSONB NOT NULL DEFAULT '{}',
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE season_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own drafts
CREATE POLICY "Users can manage own drafts" ON season_drafts
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster user lookups
CREATE INDEX idx_season_drafts_user_id ON season_drafts(user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_season_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER season_drafts_updated_at
  BEFORE UPDATE ON season_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_season_drafts_updated_at();
