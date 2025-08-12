import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Goal, Player } from '@/types/database';

export type GoalWithPlayer = Goal & {
  players: Player;
};

export function useGoalsForMatch(matchId: string | undefined) {
  return useSupabaseQuery<GoalWithPlayer[]>(
    ['goals', matchId],
    () => supabase
      .from('goals')
      .select('*, players(*)')
      .eq('match_id', matchId)
      .order('minute'),
    { enabled: !!matchId }
  );
}

export function useDeleteGoal() {
  return useSupabaseMutation<void>(
    ['goals'],
    (id: string) => 
      supabase.from('goals').delete().eq('id', id)
  );
}