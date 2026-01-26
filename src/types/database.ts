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
  tournament_mode_id: string | null;
}

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  lat?: number | null;
  lon?: number | null;
  created_at: string;
  updated_at: string;
  struttura?: string | null;
  photo_url?: string | null;
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
  squad_photo_url?: string;
  captain_id?: string;
  created_at: string;
  updated_at: string;
  venues?: { name: string } | null;
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
  nationality?: string;
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
  referee_team_id?: string | null;
  match_date: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
  stage: 'regular_season' | 'quarter-final' | 'semi-final' | 'third-place_playoff' | 'final' | null;
  video_url?: string | null;
  created_at: string;
  updated_at: string;
  venues?: { name: string } | null;
  competitions?: { name: string } | null;
  seasons?: { name: string } | null;
}

export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number;
  created_at: string;
}

export interface LeagueTableRow {
  team_id: string;
  team_name: string;
  team_logo_url?: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  fair_play_points?: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string;
  cover_image_url?: string;
  author_id?: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  article_id: string;
  content: string;
  created_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_path?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  user_id: string;
  album_id?: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  title?: string;
  description?: string;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; };
}

export interface Theme {
  id: number;
  primary_color: string | null;
  secondary_color: string | null;
  font_family: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string | null;
  event_date: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  created_at: string;
}

export interface Honor {
  id: string;
  team_id: string;
  competition_id: string;
  season_id: string;
  achievement: string;
  created_at: string;
}

export interface PlayoffBracket {
  id: string;
  competition_id: string;
  season_id: string;
  match_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TournamentModeSettings {
  phases?: string[];
  pointsPerWin?: number;
  pointsPerDraw?: number;
  pointsPerLoss?: number;
  groupCount?: number;
  teamsPerGroup?: number;
  [key: string]: unknown;
}

export interface TournamentMode {
  id: string;
  name: string;
  description?: string | null;
  handler_key: string;
  settings?: TournamentModeSettings | null;
  created_at: string;
  updated_at: string;
}

// Season Draft types for wizard persistence
export interface SeasonDraftData {
  basicInfo: {
    name: string;
    start_date?: string;
    end_date?: string;
  };
  teams: {
    team_ids: string[];
  };
  tournament: {
    tournament_mode_id?: string;
    custom_settings?: TournamentModeSettings;
    use_custom_settings: boolean;
  };
  completedSteps: number[];
  lastModified: string;
}

export interface SeasonDraft {
  id: string;
  user_id: string;
  name: string | null;
  current_step: number;
  draft_data: SeasonDraftData;
  season_id: string | null;
  created_at: string;
  updated_at: string;
}