import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { TournamentMode } from '@/types/database';

export interface UpsertTournamentModeData {
  name: string;
  description?: string;
  handler_key: string;
  settings?: object;
}

export interface UpdateTournamentModeData extends UpsertTournamentModeData {
  id: string;
}

export function useTournamentModes() {
  return useSupabaseQuery<TournamentMode[]>(
    ['tournament_modes'],
    async () => supabase.from('tournament_modes').select('*').order('name')
  );
}

export function useTournamentMode(id: string | undefined) {
  return useSupabaseQuery<TournamentMode>(
    ['tournament_mode', id],
    async () => supabase.from('tournament_modes').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateTournamentMode() {
  return useSupabaseMutation<TournamentMode>(
    ['tournament_modes'],
    async (data: UpsertTournamentModeData) => 
      supabase.from('tournament_modes').insert([data]).select().single()
  );
}

export function useUpdateTournamentMode() {
  return useSupabaseMutation<TournamentMode>(
    ['tournament_modes'],
    async ({ id, ...data }: UpdateTournamentModeData) => 
      supabase.from('tournament_modes').update(data).eq('id', id).select().single()
  );
}

export function useDeleteTournamentMode() {
  return useSupabaseMutation<void>(
    ['tournament_modes'],
    async (id: string) => 
      supabase.from('tournament_modes').delete().eq('id', id)
  );
}