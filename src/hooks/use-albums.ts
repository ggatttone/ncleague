import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Album } from '@/types/database';

export interface UpsertAlbumData {
  name: string;
  description?: string;
  user_id: string;
  cover_image_path?: string;
}

export interface UpdateAlbumData {
  id: string;
  name?: string;
  description?: string;
  cover_image_path?: string;
}

export function useAlbums() {
  return useSupabaseQuery<(Album & { item_count: number })[]>(
    ['albums'],
    async () => supabase.rpc('get_albums_with_item_count')
  );
}

export function useAlbum(id: string | undefined) {
  return useSupabaseQuery<Album>(
    ['album', id],
    async () => supabase.from('albums').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

export function useCreateAlbum() {
  return useSupabaseMutation<Album>(
    ['albums'],
    async (data: UpsertAlbumData) => 
      supabase.from('albums').insert([data]).select().single()
  );
}

export function useUpdateAlbum() {
  return useSupabaseMutation<Album>(
    ['albums'],
    async ({ id, ...data }: UpdateAlbumData) => 
      supabase.from('albums').update(data).eq('id', id).select().single()
  );
}

export function useDeleteAlbum() {
  return useSupabaseMutation<void>(
    ['albums'],
    async (id: string) => 
      supabase.from('albums').delete().eq('id', id)
  );
}