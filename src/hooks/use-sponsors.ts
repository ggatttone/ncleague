import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Sponsor, Team } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

export type SponsorWithTeams = Sponsor & { teams: Team[] };

export interface UpsertSponsorData {
  name: string;
  logo_url?: string;
  website_url?: string;
  team_ids: string[];
}

export interface UpdateSponsorData extends UpsertSponsorData {
  id: string;
}

// Fetches sponsors associated with a specific team
export function useSponsors(teamId?: string) {
  return useSupabaseQuery<Sponsor[], PostgrestError, Sponsor[]>(
    ['sponsors', { teamId }],
    () => {
      if (!teamId) return null;
      return supabase
        .from('sponsors')
        .select('*, sponsor_teams!inner(team_id)')
        .eq('sponsor_teams.team_id', teamId);
    },
    { 
      enabled: !!teamId,
      select: (data) => data || []
    }
  );
}

// Fetches all sponsors with their associated teams
export function useAllSponsors() {
    return useSupabaseQuery<SponsorWithTeams[]>(
      ['sponsors'],
      async () => supabase.from('sponsors').select('*, teams(*)').order('name')
    );
}

// Fetches a single sponsor with its associated teams
export function useSponsor(id?: string) {
    return useSupabaseQuery<SponsorWithTeams>(
        ['sponsor', id],
        async () => supabase.from('sponsors').select('*, teams(*)').eq('id', id).single(),
        { enabled: !!id }
    );
}

// Creates a sponsor and its team associations
export function useCreateSponsor() {
  return useSupabaseMutation<Sponsor, UpsertSponsorData>(
    ['sponsors'],
    async ({ team_ids, ...sponsorData }) => {
      const { data: newSponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .insert(sponsorData)
        .select()
        .single();

      if (sponsorError) throw sponsorError;
      if (!newSponsor) throw new Error("Failed to create sponsor");

      if (team_ids && team_ids.length > 0) {
        const associations = team_ids.map(team_id => ({
          sponsor_id: newSponsor.id,
          team_id: team_id,
        }));
        const { error: assocError } = await supabase.from('sponsor_teams').insert(associations);
        if (assocError) throw assocError;
      }
      
      return newSponsor;
    }
  );
}

// Updates a sponsor and its team associations
export function useUpdateSponsor() {
  return useSupabaseMutation<Sponsor, UpdateSponsorData>(
    ['sponsors'],
    async ({ id, team_ids, ...sponsorData }) => {
      const { data: updatedSponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .update(sponsorData)
        .eq('id', id)
        .select()
        .single();

      if (sponsorError) throw sponsorError;
      if (!updatedSponsor) throw new Error("Failed to update sponsor");

      const { error: deleteError } = await supabase
        .from('sponsor_teams')
        .delete()
        .eq('sponsor_id', id);
      if (deleteError) throw deleteError;

      if (team_ids && team_ids.length > 0) {
        const associations = team_ids.map(team_id => ({
          sponsor_id: id,
          team_id: team_id,
        }));
        const { error: insertError } = await supabase.from('sponsor_teams').insert(associations);
        if (insertError) throw insertError;
      }

      return updatedSponsor;
    }
  );
}

// Deletes a sponsor (associations are deleted by CASCADE)
export function useDeleteSponsor() {
  return useSupabaseMutation<void>(
    ['sponsors'],
    async (id: string) => 
      supabase.from('sponsors').delete().eq('id', id)
  );
}