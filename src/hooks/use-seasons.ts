import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Season } from '@/types/database';

export interface CreateSeasonData {
  name: string;
  start_date?: string;
  end_date?: string;
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
  return useSupabaseQuery<Season>(
    ['season', id],
    async () => supabase.from('seasons').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateSeason() {
  return useSupabaseMutation<Season>(
    ['seasons'],
    async (data: CreateSeasonData) => 
      supabase.from('seasons').insert([data]).select().single()
  );
}

export function useUpdateSeason() {
  return useSupabaseMutation<Season>(
    ['seasons'],
    async ({ id, ...data }: UpdateSeasonData) => 
      supabase.from('seasons').update(data).eq('id', id).select().single()
  );
}

export function useDeleteSeason() {
  return useSupabaseMutation<void>(
    ['seasons'],
    async (id: string) => 
      supabase.from('seasons').delete().eq('id', id)
  );
}