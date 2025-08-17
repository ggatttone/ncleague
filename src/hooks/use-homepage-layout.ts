import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { showError } from '@/utils/toast';
import { useSupabaseQuery } from './use-supabase-query';

// Definiamo i tipi per la nostra nuova struttura a griglia
export interface Widget {
  id: string;
  widget_type: string;
  settings: any;
}

export interface Column {
  id: string;
  width: number;
  widgets: Widget[];
}

export interface Row {
  id: string;
  columns: Column[];
}

export interface LayoutData {
  id: number;
  layout_data: Row[];
  updated_at: string;
}

// Hook per recuperare il layout della homepage
export function useHomepageLayout() {
  return useSupabaseQuery<LayoutData>(
    ['homepage-layout'],
    () => supabase.from('homepage_layout').select('*').eq('id', 1).single()
  );
}

// Hook per salvare/aggiornare il layout della homepage
export function useUpdateHomepageLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (layout: Row[]) => {
      const { error } = await supabase
        .from('homepage_layout')
        .update({ layout_data: layout, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-layout'] });
    },
    onError: (error) => {
      showError(`Errore nel salvataggio del layout: ${error.message}`);
    },
  });
}