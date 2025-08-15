import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Theme } from '@/types/database';

export interface UpdateThemeData {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
}

export function useTheme() {
  return useSupabaseQuery<Theme>(
    ['theme'],
    () => supabase.from('themes').select('*').eq('id', 1).single(),
    {
      staleTime: Infinity, // Theme data doesn't change often
    }
  );
}

export function useUpdateTheme() {
  return useSupabaseMutation<Theme, UpdateThemeData>(
    ['theme'],
    (data) => 
      supabase.from('themes').update(data).eq('id', 1).select().single()
  );
}