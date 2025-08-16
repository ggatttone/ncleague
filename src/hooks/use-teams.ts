import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Team } from '@/types/database';

export interface CreateTeamData {
  name: string;
  parish?: string;
  venue_id?: string;
  colors?: string;
  logo_url?: string;
}

export interface UpdateTeamData extends CreateTeamData {
  id: string;
}

export function useTeams() {
  return useSupabaseQuery<Team[]>(
    ['teams'],
    () => supabase.from('teams').select('*, venues(*)').order('name')
  );
}

export function useTeam(id: string | undefined) {
  return useSupabaseQuery<Team>(
    ['team', id],
    () => supabase.from('teams').select('*, venues(*)').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateTeam() {
  return useSupabaseMutation<Team>(
    ['teams'],
    (data: CreateTeamData) => 
      supabase.from('teams').insert([data]).select().single()
  );
}

export function useUpdateTeam() {
  return useSupabaseMutation<Team>(
    ['teams'],
    ({ id, ...data }: UpdateTeamData) => 
      supabase.from('teams').update(data).eq('id', id).select().single()
  );
}

export function useDeleteTeam() {
  return useSupabaseMutation<void>(
    ['teams'],
    (id: string) => 
      supabase.from('teams').delete().eq('id', id)
  );
}