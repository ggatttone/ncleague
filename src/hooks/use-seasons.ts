import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Season } from '@/types/database';

export interface CreateSeasonData {
  name: string;
  start_date?: string;
  end_date?: string;
  tournament_mode_id?: string | null;
  team_ids?: string[];
}

export interface UpdateSeasonData extends CreateSeasonData {
  id: string;
}

export function useSeasons() {
  return useSupabaseQuery<Season[]>(
    ['seasons'],
    async () => supabase.from('seasons').select('*').order('start_date', { ascending: false })
  );
}

export function useSeason(id: string | undefined) {
  return useSupabaseQuery<(Season & { teams: { id: string }[] })>(
    ['season', id],
    async () => {
      if (!id) return null;
      return supabase.from('seasons').select('*, teams(id)').eq('id', id).single();
    },
    { enabled: !!id }
  );
}

export interface SeasonWithTournamentMode extends Season {
  tournament_modes: {
    id: string;
    name: string;
    handler_key: string;
    settings: Record<string, unknown> | null;
  } | null;
}

export function useSeasonWithTournamentMode(id: string | undefined) {
  return useSupabaseQuery<SeasonWithTournamentMode>(
    ['season-with-tournament-mode', id],
    async () => {
      if (!id) return null;
      return supabase
        .from('seasons')
        .select('*, tournament_modes(id, name, handler_key, settings)')
        .eq('id', id)
        .single();
    },
    { enabled: !!id }
  );
}

export function useCreateSeason() {
  return useSupabaseMutation<Season, CreateSeasonData>(
    ['seasons'],
    async ({ team_ids, ...seasonData }) => {
      // 1. Insert the season
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert([seasonData])
        .select()
        .single();

      if (seasonError) return { data: null, error: seasonError };
      if (!newSeason) return { data: null, error: { message: "Failed to create season" } as any };

      // 2. Insert team associations
      if (team_ids && team_ids.length > 0) {
        const associations = team_ids.map(team_id => ({
          season_id: newSeason.id,
          team_id: team_id,
        }));
        const { error: assocError } = await supabase.from('season_teams').insert(associations);
        if (assocError) return { data: null, error: assocError };
      }

      return { data: newSeason, error: null };
    }
  );
}

export function useUpdateSeason() {
  return useSupabaseMutation<Season, UpdateSeasonData>(
    ['seasons'],
    async ({ id, team_ids, ...seasonData }) => {
      // 1. Update the season details
      const { data: updatedSeason, error: seasonError } = await supabase
        .from('seasons')
        .update(seasonData)
        .eq('id', id)
        .select()
        .single();

      if (seasonError) return { data: null, error: seasonError };
      if (!updatedSeason) return { data: null, error: { message: "Failed to update season" } as any };

      // 2. Delete existing team associations for this season
      const { error: deleteError } = await supabase
        .from('season_teams')
        .delete()
        .eq('season_id', id);
      if (deleteError) return { data: null, error: deleteError };

      // 3. Insert new team associations
      if (team_ids && team_ids.length > 0) {
        const associations = team_ids.map(team_id => ({
          season_id: id,
          team_id: team_id,
        }));
        const { error: insertError } = await supabase.from('season_teams').insert(associations);
        if (insertError) return { data: null, error: insertError };
      }

      return { data: updatedSeason, error: null };
    }
  );
}

export function useDeleteSeason() {
  return useSupabaseMutation<void>(
    ['seasons'],
    async (id: string) => 
      supabase.from('seasons').delete().eq('id', id)
  );
}