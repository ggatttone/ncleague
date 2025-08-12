import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Player } from '@/types/database';

export interface CreatePlayerData {
  first_name: string;
  last_name: string;
  team_id?: string;
  date_of_birth?: string;
  role?: string;
  jersey_number?: number;
  document_id?: string;
}

export interface UpdatePlayerData extends CreatePlayerData {
  id: string;
}

export function usePlayers() {
  return useSupabaseQuery<(Player & { teams: { id: string, name: string } | null })[]>(
    ['players'],
    () => supabase.from('players').select('*, teams (id, name)').order('last_name')
  );
}

export function usePlayer(id: string | undefined) {
  return useSupabaseQuery<Player>(
    ['player', id],
    () => supabase.from('players').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreatePlayer() {
  return useSupabaseMutation<Player>(
    ['players'],
    (data: CreatePlayerData) => 
      supabase.from('players').insert([data]).select().single()
  );
}

export function useUpdatePlayer() {
  return useSupabaseMutation<Player>(
    ['players'],
    ({ id, ...data }: UpdatePlayerData) => 
      supabase.from('players').update(data).eq('id', id).select().single()
  );
}

export function useDeletePlayer() {
  return useSupabaseMutation<void>(
    ['players'],
    (id: string) => 
      supabase.from('players').delete().eq('id', id)
  );
}