import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Goal, Player } from '@/types/database';

export type GoalWithPlayer = Goal & {
  players: Player;
};

export interface CreateGoalData {
  match_id: string;
  player_id: string;
  team_id: string;
  minute: number;
}

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

export function useCreateGoal() {
  return useSupabaseMutation<Goal>(
    ['goals'],
    (data: CreateGoalData) => 
      supabase.from('goals').insert([data]).select().single()
  );
}

export function useDeleteGoal() {
  return useSupabaseMutation<void>(
    ['goals'],
    (id: string) => 
      supabase.from('goals').delete().eq('id', id)
  );
}