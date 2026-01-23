import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { LeagueTableRow } from '@/types/database';

export interface PointsConfig {
  pointsPerWin?: number;
  pointsPerDraw?: number;
  pointsPerLoss?: number;
}

/**
 * Fetch league table standings
 *
 * @param competitionId - Competition UUID
 * @param seasonId - Season UUID
 * @param pointsConfig - Optional custom points configuration (from tournament mode settings)
 */
export function useLeagueTable(
  competitionId: string | undefined,
  seasonId: string | undefined,
  pointsConfig?: PointsConfig
) {
  return useSupabaseQuery<LeagueTableRow[]>(
    ['league-table', competitionId, seasonId, pointsConfig?.pointsPerWin, pointsConfig?.pointsPerDraw, pointsConfig?.pointsPerLoss],
    async () => {
      if (!competitionId || !seasonId) return null;

      // Build RPC params - include points config if provided
      const rpcParams: Record<string, unknown> = {
        p_competition_id: competitionId,
        p_season_id: seasonId,
      };

      // Add points configuration if provided
      // These parameters may or may not be supported by the RPC function
      // If not supported, they'll be ignored
      if (pointsConfig?.pointsPerWin !== undefined) {
        rpcParams.p_points_win = pointsConfig.pointsPerWin;
      }
      if (pointsConfig?.pointsPerDraw !== undefined) {
        rpcParams.p_points_draw = pointsConfig.pointsPerDraw;
      }
      if (pointsConfig?.pointsPerLoss !== undefined) {
        rpcParams.p_points_loss = pointsConfig.pointsPerLoss;
      }

      return supabase.rpc('get_league_table', rpcParams);
    },
    { enabled: !!competitionId && !!seasonId }
  );
}

/**
 * Hook that combines season tournament mode with league table
 * Automatically uses the points configuration from the tournament mode
 */
export function useLeagueTableWithTournamentMode(
  competitionId: string | undefined,
  seasonId: string | undefined,
  tournamentModeSettings?: Record<string, unknown> | null
) {
  const pointsConfig: PointsConfig | undefined = tournamentModeSettings
    ? {
        pointsPerWin: tournamentModeSettings.pointsPerWin as number | undefined,
        pointsPerDraw: tournamentModeSettings.pointsPerDraw as number | undefined,
        pointsPerLoss: tournamentModeSettings.pointsPerLoss as number | undefined,
      }
    : undefined;

  return useLeagueTable(competitionId, seasonId, pointsConfig);
}
