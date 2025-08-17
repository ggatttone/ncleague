import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { showError } from '@/utils/toast';
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';

export interface HomepageWidget {
  id: string;
  widget_type: string;
  sort_order: number;
  settings: any;
  created_at: string;
}

// Hook to get all homepage widgets
export function useHomepageLayout() {
  return useSupabaseQuery<HomepageWidget[]>(
    ['homepage-layout'],
    () => supabase.from('homepage_layout').select('*').order('sort_order')
  );
}

// Hook to add a new widget
export function useAddHomepageWidget() {
  return useSupabaseMutation<HomepageWidget, Partial<HomepageWidget>>(
    ['homepage-layout'],
    (widgetData) => supabase.from('homepage_layout').insert(widgetData).select().single()
  );
}

// Hook to update a widget (e.g., settings)
export function useUpdateHomepageWidget() {
  return useSupabaseMutation<HomepageWidget, Partial<HomepageWidget> & { id: string }>(
    ['homepage-layout'],
    ({ id, ...updates }) => supabase.from('homepage_layout').update(updates).eq('id', id).select().single()
  );
}

// Hook to delete a widget
export function useDeleteHomepageWidget() {
  return useSupabaseMutation<void, string>(
    ['homepage-layout'],
    (id) => supabase.from('homepage_layout').delete().eq('id', id)
  );
}

// Custom hook for reordering widgets
export function useReorderHomepageWidgets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (widgets: { id: string; sort_order: number }[]) => {
      const { error } = await supabase.from('homepage_layout').upsert(widgets);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage-layout'] });
    },
    onError: (error) => {
      showError(`Error reordering widgets: ${error.message}`);
    },
  });
}