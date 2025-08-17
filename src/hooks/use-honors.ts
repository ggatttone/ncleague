import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Honor, Competition, Season } from '@/types/database';

export type HonorWithDetails = Honor & {
  competitions: Competition | null;
  seasons: Season | null;
  teams: { name: string } | null;
};

export interface UpsertHonorData {
  team_id: string;
  competition_id: string;
  season_id: string;
  achievement: string;
}

export interface UpdateHonorData extends UpsertHonorData {
  id: string;
}

export function useHonors(teamId?: string) {
  return useSupabaseQuery<(Honor & { competitions: { name: string } | null, seasons: { name: string } | null })[]>(
    ['honors', { teamId }],
    () => supabase
      .from('honors')
      .select('*, competitions(name), seasons(name)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false }),
    { enabled: !!teamId }
  );
}

export function useAllHonors() {
    return useSupabaseQuery<HonorWithDetails[]>(
      ['honors'],
      () => supabase
        .from('honors')
        .select('*, teams(name), competitions(name), seasons(name)')
        .order('created_at', { ascending: false })
    );
}

export function useHonor(id?: string) {
    return useSupabaseQuery<Honor>(
        ['honor', id],
        () => supabase.from('honors').select('*').eq('id', id).single(),
        { enabled: !!id }
    );
}

export function useCreateHonor() {
  return useSupabaseMutation<Honor>(
    ['honors'],
    async (data: UpsertHonorData) => 
      supabase.from('honors').insert([data]).select().single()
  );
}

export function useUpdateHonor() {
  return useSupabaseMutation<Honor>(
    ['honors'],
    async ({ id, ...data }: UpdateHonorData) => 
      supabase.from('honors').update(data).eq('id', id).select().single()
  );
}

export function useDeleteHonor() {
  return useSupabaseMutation<void>(
    ['honors'],
    async (id: string) => 
      supabase.from('honors').delete().eq('id', id)
  );
}