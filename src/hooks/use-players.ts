import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Player } from '@/types/database';

export interface CreatePlayerData {
  first_name: string;
  last_name: string;
  team_id?: string | null;
  date_of_birth?: string | null;
  role?: string | null;
  jersey_number?: number | null;
  document_id?: string | null;
  nationality?: string | null;
  photo_url?: string | null;
}

export interface UpdatePlayerData extends CreatePlayerData {
  id: string;
}

export function usePlayers() {
  return useSupabaseQuery<(Player & { teams: { id: string, name: string } | null })[]>(
    ['players'],
    () => supabase.from('players').select('*, teams!players_team_id_fkey(id, name)').order('last_name')
  );
}

export function usePlayer(id: string | undefined) {
  return useSupabaseQuery<(Player & { teams: { id: string, name: string } | null })>(
    ['player', id],
    () => supabase.from('players').select('*, teams!players_team_id_fkey(id, name)').eq('id', id).single(),
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