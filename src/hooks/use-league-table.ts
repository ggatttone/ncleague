import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { LeagueTableRow } from '@/types/database';

export function useLeagueTable(competitionId: string | undefined, seasonId: string | undefined) {
  return useSupabaseQuery<LeagueTableRow[]>(
    ['league-table', competitionId, seasonId],
    () => {
      if (!competitionId || !seasonId) return null;
      return supabase.rpc('get_league_table', {
        p_competition_id: competitionId,
        p_season_id: seasonId,
      });
    },
    { enabled: !!competitionId && !!seasonId }
  );
}