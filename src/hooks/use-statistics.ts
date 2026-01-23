import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client"; // Corretto il percorso

export interface TopScorer {
  rank: number;
  player_id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  team_name: string;
  goals_scored: number;
}

const fetchTopScorers = async (
  competitionId: string,
  seasonId: string,
  stageFilter?: string
): Promise<TopScorer[]> => {
  if (!competitionId || !seasonId) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_top_scorers', {
    p_competition_id: competitionId,
    p_season_id: seasonId,
    p_stage_filter: stageFilter || null,
  });

  if (error) {
    console.error("Error fetching top scorers:", error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useTopScorers = (
  competitionId: string,
  seasonId: string,
  stageFilter?: string
) => {
  return useQuery<TopScorer[], Error>({
    queryKey: ["topScorers", competitionId, seasonId, stageFilter],
    queryFn: () => fetchTopScorers(competitionId, seasonId, stageFilter),
    enabled: !!competitionId && !!seasonId,
  });
};