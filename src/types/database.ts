export interface Team {
  id: string;
  name: string;
  parish?: string;
  venue?: string;
  colors?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  role?: string;
  jersey_number?: number;
  document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue?: string;
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