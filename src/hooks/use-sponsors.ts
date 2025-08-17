import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Sponsor } from '@/types/database';

export interface UpsertSponsorData {
  team_id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
}

export interface UpdateSponsorData extends UpsertSponsorData {
  id: string;
}

export function useSponsors(teamId?: string) {
  return useSupabaseQuery<Sponsor[]>(
    ['sponsors', { teamId }],
    () => supabase
      .from('sponsors')
      .select('*')
      .eq('team_id', teamId)
      .order('name'),
    { enabled: !!teamId }
  );
}

export function useAllSponsors() {
    return useSupabaseQuery<(Sponsor & { teams: { name: string } | null })[]>(
      ['sponsors'],
      () => supabase.from('sponsors').select('*, teams(name)').order('name')
    );
}

export function useSponsor(id?: string) {
    return useSupabaseQuery<Sponsor>(
        ['sponsor', id],
        () => supabase.from('sponsors').select('*').eq('id', id).single(),
        { enabled: !!id }
    );
}

export function useCreateSponsor() {
  return useSupabaseMutation<Sponsor>(
    ['sponsors'],
    async (data: UpsertSponsorData) => 
      supabase.from('sponsors').insert([data]).select().single()
  );
}

export function useUpdateSponsor() {
  return useSupabaseMutation<Sponsor>(
    ['sponsors'],
    async ({ id, ...data }: UpdateSponsorData) => 
      supabase.from('sponsors').update(data).eq('id', id).select().single()
  );
}

export function useDeleteSponsor() {
  return useSupabaseMutation<void>(
    ['sponsors'],
    async (id: string) => 
      supabase.from('sponsors').delete().eq('id', id)
  );
}