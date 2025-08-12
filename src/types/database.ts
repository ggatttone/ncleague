export interface Competition {
  id: string;
  name: string;
  slug?: string;
  level?: number;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lon?: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  slug?: string;
  short_name?: string;
  parish?: string;
  venue_id?: string;
  colors?: string;
  logo_url?: string;
  captain_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  slug?: string;
  photo_url?: string;
  bio?: string;
  date_of_birth?: string;
  role?: string; // This is 'position'
  jersey_number?: number;
  document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  team_id?: string;
  first_name: string;
  last_name: string;
  job?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  competition_id?: string;
  season_id?: string;
  venue_id?: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number;
  created_at: string;
}