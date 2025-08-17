import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Team } from '@/types/database';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showError } from '@/utils/toast';

export interface CreateTeamData {
  name: string;
  parish?: string;
  venue_id?: string;
  colors?: string;
  logo_url?: string;
  squad_photo_url?: string;
}

export interface UpdateTeamData extends CreateTeamData {
  id: string;
}

export function useTeams() {
  return useSupabaseQuery<Team[]>(
    ['teams'],
    async () => supabase.from('teams').select('*, venues(name)').order('name')
  );
}

export function useTeam(id: string | undefined) {
  return useSupabaseQuery<Team>(
    ['team', id],
    async () => supabase.from('teams').select('*, venues(name)').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation<Team | null, Error, CreateTeamData>({
    mutationFn: async (data: CreateTeamData) => {
      // 1. Inserisci la nuova squadra e ottieni l'ID
      const { data: insertedTeam, error: insertError } = await supabase
        .from('teams')
        .insert([data])
        .select('id')
        .single();

      if (insertError) {
        showError(insertError.message);
        throw insertError;
      }
      if (!insertedTeam) {
        throw new Error("Creazione squadra fallita.");
      }

      // 2. Recupera i dati completi della nuova squadra, incluse le relazioni
      const { data: newTeamWithRelations, error: fetchError } = await supabase
        .from('teams')
        .select('*, venues(name)')
        .eq('id', insertedTeam.id)
        .single();

      if (fetchError) {
        showError(fetchError.message);
        throw fetchError;
      }

      return newTeamWithRelations;
    },
    onSuccess: (newTeam) => {
      if (!newTeam) return;

      // 3. Aggiorna manualmente la cache con la nuova squadra
      queryClient.setQueryData<Team[]>(['teams'], (oldData) => {
        if (!oldData) return [newTeam];
        
        const newData = [...oldData, newTeam];
        // Mantieni l'ordine alfabetico
        newData.sort((a, b) => a.name.localeCompare(b.name));
        return newData;
      });
    },
  });
}

export function useUpdateTeam() {
  return useSupabaseMutation<Team>(
    ['teams'],
    async ({ id, ...data }: UpdateTeamData) => 
      supabase.from('teams').update(data).eq('id', id).select().single()
  );
}

export function useDeleteTeam() {
  return useSupabaseMutation<void>(
    ['teams'],
    async (id: string) => 
      supabase.from('teams').delete().eq('id', id)
  );
}