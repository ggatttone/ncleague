import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Competition } from '@/types/database';

export interface CreateCompetitionData {
  name: string;
  slug?: string;
  level?: number;
}

export interface UpdateCompetitionData extends CreateCompetitionData {
  id: string;
}

export function useCompetitions() {
  return useSupabaseQuery<Competition[]>(
    ['competitions'],
    async () => supabase.from('competitions').select('*').order('level').order('name')
  );
}

export function useCompetition(id: string | undefined) {
  return useSupabaseQuery<Competition>(
    ['competition', id],
    async () => supabase.from('competitions').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateCompetition() {
  return useSupabaseMutation<Competition>(
    ['competitions'],
    async (data: CreateCompetitionData) => 
      supabase.from('competitions').insert([data]).select().single()
  );
}

export function useUpdateCompetition() {
  return useSupabaseMutation<Competition>(
    ['competitions'],
    async ({ id, ...data }: UpdateCompetitionData) => 
      supabase.from('competitions').update(data).eq('id', id).select().single()
  );
}

export function useDeleteCompetition() {
  return useSupabaseMutation<void>(
    ['competitions'],
    async (id: string) => 
      supabase.from('competitions').delete().eq('id', id)
  );
}