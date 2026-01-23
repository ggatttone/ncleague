import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { LeagueTableRow } from '@/types/database';
import type { PointsConfig } from './use-league-table';

/**
 * Fetch NCL standings with optional stage filter and points configuration
 *
 * @param competitionId - Competition UUID
 * @param seasonId - Season UUID
 * @param stage - Stage filter (e.g., 'regular_season', 'poule_a', 'group_a')
 * @param pointsConfig - Optional custom points configuration
 */
export function useNclStandings(
  competitionId: string | undefined,
  seasonId: string | undefined,
  stage: string | undefined,
  pointsConfig?: PointsConfig
) {
  return useSupabaseQuery<LeagueTableRow[]>(
    ['ncl-standings', competitionId, seasonId, stage, pointsConfig?.pointsPerWin, pointsConfig?.pointsPerDraw, pointsConfig?.pointsPerLoss],
    () => {
      if (!competitionId || !seasonId || !stage) return null;

      // Build RPC params
      const rpcParams: Record<string, unknown> = {
        p_competition_id: competitionId,
        p_season_id: seasonId,
        p_stage_filter: stage,
      };

      // Add points configuration if provided
      if (pointsConfig?.pointsPerWin !== undefined) {
        rpcParams.p_points_win = pointsConfig.pointsPerWin;
      }
      if (pointsConfig?.pointsPerDraw !== undefined) {
        rpcParams.p_points_draw = pointsConfig.pointsPerDraw;
      }
      if (pointsConfig?.pointsPerLoss !== undefined) {
        rpcParams.p_points_loss = pointsConfig.pointsPerLoss;
      }

      return supabase.rpc('get_ncl_standings', rpcParams);
    },
    { enabled: !!competitionId && !!seasonId && !!stage }
  );
}

/**
 * Hook that uses standings with tournament mode settings
 */
export function useNclStandingsWithTournamentMode(
  competitionId: string | undefined,
  seasonId: string | undefined,
  stage: string | undefined,
  tournamentModeSettings?: Record<string, unknown> | null
) {
  const pointsConfig: PointsConfig | undefined = tournamentModeSettings
    ? {
        pointsPerWin: tournamentModeSettings.pointsPerWin as number | undefined,
        pointsPerDraw: tournamentModeSettings.pointsPerDraw as number | undefined,
        pointsPerLoss: tournamentModeSettings.pointsPerLoss as number | undefined,
      }
    : undefined;

  return useNclStandings(competitionId, seasonId, stage, pointsConfig);
}
