import { useSupabaseQuery } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Competition, Season } from '@/types/database';

// Cache times for static data (rarely changes)
const STATIC_DATA_STALE_TIME = 1000 * 60 * 30; // 30 minutes

/**
 * Hook to get the main competition (lowest level)
 * Cached aggressively since competitions rarely change
 */
export function useMainCompetition() {
  return useSupabaseQuery<Competition>(
    ['main-competition'],
    async () =>
      supabase
        .from('competitions')
        .select('*')
        .order('level')
        .limit(1)
        .single(),
    { staleTime: STATIC_DATA_STALE_TIME }
  );
}

/**
 * Hook to get the latest season
 * Cached aggressively since seasons rarely change
 */
export function useLatestSeason() {
  return useSupabaseQuery<Season>(
    ['latest-season'],
    async () =>
      supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(1)
        .single(),
    { staleTime: STATIC_DATA_STALE_TIME }
  );
}

/**
 * Combined hook for components that need both competition and season
 * Reduces boilerplate in consuming components
 */
export function useMainCompetitionAndSeason() {
  const competition = useMainCompetition();
  const season = useLatestSeason();

  return {
    competition: competition.data,
    season: season.data,
    isLoading: competition.isLoading || season.isLoading,
    error: competition.error || season.error,
  };
}
