-- COPIA E INCOLLA QUESTO NEL SQL EDITOR DEL NUOVO PROGETTO

-- Crea tabelle
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parish TEXT,
  venue TEXT,
  colors TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  role TEXT,
  jersey_number INTEGER,
  document_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  minute INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policy pubbliche
CREATE POLICY "public_read_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "auth_all_teams" ON teams FOR ALL TO authenticated USING (true);

CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);
CREATE POLICY "auth_all_players" ON players FOR ALL TO authenticated USING (true);

CREATE POLICY "public_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "auth_all_matches" ON matches FOR ALL TO authenticated USING (true);

CREATE POLICY "public_read_goals" ON goals FOR SELECT USING (true);
CREATE POLICY "auth_all_goals" ON goals FOR ALL TO authenticated USING (true);