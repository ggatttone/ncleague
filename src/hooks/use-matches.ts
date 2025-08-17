import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Match, Team } from '@/types/database';

export type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
  referee_teams: Team | null;
};

export interface UpsertMatchData {
  home_team_id: string;
  away_team_id: string;
  referee_team_id?: string;
  match_date: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'postponed' | 'cancelled';
  venue_id?: string;
  competition_id?: string;
  season_id?: string;
  home_score?: number;
  away_score?: number;
}

export interface UpdateMatchData extends UpsertMatchData {
  id: string;
}

export interface BulkUpdateData {
  ids: string[];
  updates: Partial<Omit<Match, 'id'>>;
}

export function useMatches() {
  return useSupabaseQuery<MatchWithTeams[]>(
    ['matches'],
    async () => supabase
      .from('matches')
      .select(`
        *,
        venues(name),
        home_teams:teams!matches_home_team_id_fkey(*),
        away_teams:teams!matches_away_team_id_fkey(*),
        referee_teams:teams!matches_referee_team_id_fkey(*)
      `)
      .order('match_date', { ascending: false })
  );
}

export function useMatch(id: string | undefined) {
    return useSupabaseQuery<MatchWithTeams>(
        ['match', id],
        async () => supabase
          .from('matches')
          .select(`
            *,
            venues(name),
            home_teams:teams!matches_home_team_id_fkey(*),
            away_teams:teams!matches_away_team_id_fkey(*),
            referee_teams:teams!matches_referee_team_id_fkey(*)
          `)
          .eq('id', id)
          .single(),
        { enabled: !!id }
    );
}

export function useTeamMatches(teamId?: string) {
  return useSupabaseQuery<MatchWithTeams[]>(
    ['matches', { teamId }],
    () => {
      if (!teamId) return null;
      return supabase
        .from('matches')
        .select(`
          *,
          venues(name),
          home_teams:teams!matches_home_team_id_fkey(*),
          away_teams:teams!matches_away_team_id_fkey(*),
          referee_teams:teams!matches_referee_team_id_fkey(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: false });
    },
    { enabled: !!teamId }
  );
}

export function useCreateMatch() {
    return useSupabaseMutation<Match>(
        ['matches'],
        async (data: UpsertMatchData) =>
            supabase.from('matches').insert([data]).select().single()
    );
}

export function useCreateMultipleMatches() {
    return useSupabaseMutation<Match[]>(
        ['matches'],
        async (data: UpsertMatchData[]) =>
            supabase.from('matches').insert(data).select()
    );
}

export function useUpdateMatch() {
    return useSupabaseMutation<Match>(
        ['matches'],
        async ({ id, ...data }: UpdateMatchData) =>
            supabase.from('matches').update(data).eq('id', id).select().single()
    );
}

export function useDeleteMatch() {
  return useSupabaseMutation<void>(
    ['matches'],
    async (id: string) => 
      supabase.from('matches').delete().eq('id', id)
  );
}

export function useUpdateMultipleMatches() {
  return useSupabaseMutation<Match[], BulkUpdateData>(
    ['matches'],
    async ({ ids, updates }) =>
      supabase.from('matches').update(updates).in('id', ids).select()
  );
}

export function useDeleteMultipleMatches() {
  return useSupabaseMutation<void, string[]>(
    ['matches'],
    async (ids: string[]) =>
      supabase.from('matches').delete().in('id', ids)
  );
}