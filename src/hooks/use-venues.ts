import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Venue } from '@/types/database';

export interface CreateVenueData {
  name: string;
  address?: string;
  city?: string;
  struttura?: string;
  photo_url?: string;
  lat?: number;
  lon?: number;
}

export interface UpdateVenueData extends CreateVenueData {
  id: string;
}

export function useVenues() {
  return useSupabaseQuery<Venue[]>(
    ['venues'],
    async () => supabase.from('venues').select('*').order('name')
  );
}

export function useVenue(id: string | undefined) {
  return useSupabaseQuery<Venue>(
    ['venue', id],
    async () => supabase.from('venues').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateVenue() {
  return useSupabaseMutation<Venue>(
    ['venues'],
    async (data: CreateVenueData) => 
      supabase.from('venues').insert([data]).select().single()
  );
}

export function useUpdateVenue() {
  return useSupabaseMutation<Venue>(
    ['venues'],
    async ({ id, ...data }: UpdateVenueData) => 
      supabase.from('venues').update(data).eq('id', id).select().single()
  );
}

export function useDeleteVenue() {
  return useSupabaseMutation<void>(
    ['venues'],
    async (id: string) => 
      supabase.from('venues').delete().eq('id', id)
  );
}