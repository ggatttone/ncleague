import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface TopScorer {
  rank: number;
  player_id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  team_name: string;
  goals_scored: number;
}

const fetchTopScorers = async (competitionId: string, seasonId: string): Promise<TopScorer[]> => {
  if (!competitionId || !seasonId) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_top_scorers', {
    p_competition_id: competitionId,
    p_season_id: seasonId,
  });

  if (error) {
    console.error("Error fetching top scorers:", error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useTopScorers = (competitionId: string, seasonId: string) => {
  return useQuery<TopScorer[], Error>({
    queryKey: ["topScorers", competitionId, seasonId],
    queryFn: () => fetchTopScorers(competitionId, seasonId),
    enabled: !!competitionId && !!seasonId, // Esegui la query solo se entrambi gli ID sono presenti
  });
};