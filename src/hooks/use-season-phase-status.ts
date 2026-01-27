import { useMemo } from 'react';
import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';

export interface PhaseStatus {
  phaseId: string;
  phaseName: string;
  totalMatches: number;
  completedMatches: number;
  scheduledMatches: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
}

interface MatchRow {
  id: string;
  stage: string | null;
  status: string;
}

export function useSeasonPhaseStatus(seasonId: string | undefined) {
  const { data: matches, ...rest } = useSupabaseQuery<MatchRow[]>(
    ['season-phase-matches', seasonId],
    async () => {
      if (!seasonId) return null;
      return supabase
        .from('matches')
        .select('id, stage, status')
        .eq('season_id', seasonId);
    },
    { enabled: !!seasonId }
  );

  const phaseStatusMap = useMemo(() => {
    if (!matches) return new Map<string, PhaseStatus>();

    const grouped = new Map<string, MatchRow[]>();
    for (const match of matches) {
      const stage = match.stage || 'unknown';
      if (!grouped.has(stage)) grouped.set(stage, []);
      grouped.get(stage)!.push(match);
    }

    const result = new Map<string, PhaseStatus>();
    for (const [stage, stageMatches] of grouped) {
      const completed = stageMatches.filter(m => m.status === 'completed').length;
      const scheduled = stageMatches.filter(m => m.status === 'scheduled').length;
      const total = stageMatches.length;

      let status: PhaseStatus['status'];
      if (total === 0) {
        status = 'pending';
      } else if (completed === total) {
        status = 'completed';
      } else if (completed > 0 || stageMatches.some(m => m.status === 'ongoing')) {
        status = 'in_progress';
      } else {
        status = 'scheduled';
      }

      result.set(stage, {
        phaseId: stage,
        phaseName: stage,
        totalMatches: total,
        completedMatches: completed,
        scheduledMatches: scheduled,
        status,
      });
    }

    return result;
  }, [matches]);

  return { phaseStatusMap, ...rest };
}
