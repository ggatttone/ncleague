import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Match, Team } from '@/types/database';

export type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

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

export function useDeleteMatch() {
  return useSupabaseMutation<void>(
    ['matches'],
    (id: string) => 
      supabase.from('matches').delete().eq('id', id)
  );
}