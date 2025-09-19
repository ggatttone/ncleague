import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { PlayoffBracket } from '@/types/database';
import { MatchWithTeams } from './use-matches';

export function usePlayoffBracket(competitionId?: string, seasonId?: string) {
  return useSupabaseQuery(
    ['playoff-bracket', competitionId, seasonId],
    async () => {
      if (!competitionId || !seasonId) return null;

      // 1. Fetch the playoff bracket to get match IDs
      const { data: bracket, error: bracketError } = await supabase
        .from('playoff_brackets')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('season_id', seasonId)
        .single<PlayoffBracket>();

      if (bracketError) {
        if (bracketError.code === 'PGRST116') return { bracket: null, matches: [] }; // No bracket found, not an error
        throw bracketError;
      }
      
      if (!bracket || !bracket.match_ids || bracket.match_ids.length === 0) {
        return { bracket: null, matches: [] };
      }

      // 2. Fetch the matches using the IDs from the bracket
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          home_teams:teams!matches_home_team_id_fkey(*),
          away_teams:teams!matches_away_team_id_fkey(*)
        `)
        .in('id', bracket.match_ids)
        .order('match_date', { ascending: true });

      if (matchesError) {
        throw matchesError;
      }

      return { bracket, matches: (matches as MatchWithTeams[]) || [] };
    },
    { enabled: !!competitionId && !!seasonId }
  );
}