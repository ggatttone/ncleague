-- Add competition_id to seasons table
ALTER TABLE seasons
  ADD COLUMN competition_id uuid REFERENCES competitions(id) ON DELETE SET NULL;

-- Set existing seasons to the single existing competition
UPDATE seasons
SET competition_id = (SELECT id FROM competitions LIMIT 1)
WHERE competition_id IS NULL;
