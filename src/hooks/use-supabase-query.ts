import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { showError, showSuccess } from '@/utils/toast';

export function useSupabaseQuery<T>(
  key: string[],
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await query();
      if (error) {
        showError(error.message);
        throw error;
      }
      return data;
    },
    ...options,
  });
}

export function useSupabaseMutation<T>(
  key: string[],
  mutation: (variables: any) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const { data, error } = await mutation(variables);
      if (error) {
        showError(error.message);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      showSuccess('Operazione completata con successo');
    },
    ...options,
  });
}