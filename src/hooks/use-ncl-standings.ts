import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { LeagueTableRow } from '@/types/database';

export function useNclStandings(competitionId: string | undefined, seasonId: string | undefined, stage: string | undefined) {
  return useSupabaseQuery<LeagueTableRow[]>(
    ['ncl-standings', competitionId, seasonId, stage],
    () => {
      if (!competitionId || !seasonId || !stage) return null;
      return supabase.rpc('get_ncl_standings', {
        p_competition_id: competitionId,
        p_season_id: seasonId,
        p_stage_filter: stage,
      });
    },
    { enabled: !!competitionId && !!seasonId && !!stage }
  );
}