import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { GalleryItem } from '@/types/database';

export type GalleryItemWithAuthor = GalleryItem & {
  profiles: { first_name: string | null; last_name: string | null } | null;
};

export function useGalleryItems() {
  return useSupabaseQuery<GalleryItemWithAuthor[]>(
    ['gallery-items'],
    () => supabase
      .from('gallery_items')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
  );
}

export function useDeleteGalleryItem() {
  return useSupabaseMutation(
    ['gallery-items'],
    async (item: GalleryItem) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('gallery_media')
        .remove([item.file_path]);
      
      if (storageError) {
        // Log error but proceed to delete DB record anyway, as it might be an orphan
        console.error("Error deleting from storage:", storageError.message);
      }

      // 2. Delete from database
      const { data, error: dbError } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', item.id)
        .select()
        .single();
        
      if (dbError) throw dbError;
      return data;
    }
  );
}