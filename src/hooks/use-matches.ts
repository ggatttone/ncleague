import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Match, Team } from '@/types/database';

export type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

export interface UpsertMatchData {
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
  venue_id?: string;
  competition_id?: string;
  season_id?: string;
  home_score?: number;
  away_score?: number;
}

export interface UpdateMatchData extends UpsertMatchData {
  id: string;
}

export function useMatches() {
  return useSupabaseQuery<MatchWithTeams[]>(
    ['matches'],
    () => supabase
      .from('matches')
      .select(`
        *,
        home_teams:teams!matches_home_team_id_fkey(*),
        away_teams:teams!matches_away_team_id_fkey(*)
      `)
      .order('match_date', { ascending: false })
  );
}

export function useMatch(id: string | undefined) {
    return useSupabaseQuery<Match>(
        ['match', id],
        () => supabase.from('matches').select('*').eq('id', id).single(),
        { enabled: !!id }
    );
}

export function useCreateMatch() {
    return useSupabaseMutation<Match>(
        ['matches'],
        (data: UpsertMatchData) =>
            supabase.from('matches').insert([data]).select().single()
    );
}

export function useUpdateMatch() {
    return useSupabaseMutation<Match>(
        ['matches'],
        ({ id, ...data }: UpdateMatchData) =>
            supabase.from('matches').update(data).eq('id', id).select().single()
    );
}

export function useDeleteMatch() {
  return useSupabaseMutation<void>(
    ['matches'],
    (id: string) => 
      supabase.from('matches').delete().eq('id', id)
  );
}