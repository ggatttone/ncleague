import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';

export function useSupabaseQuery<T>(
  key: any[],
  query: () => Promise<{ data: T | null; error: PostgrestError | null }> | null,
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const promise = query();
      if (!promise) {
        return null;
      }
      const { data, error } = await promise;
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
  options: { onSuccess?: (data: T | null) => void, [key: string]: any } = {}
) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: async (variables: any) => {
      const { data, error } = await mutation(variables);
      if (error) {
        showError(error.message);
        throw error;
      }
      return data;
    },
    onSuccess: (data: T | null) => {
      queryClient.invalidateQueries({ queryKey: key });

      if (data && (data as any).id && key.length > 0 && typeof key[0] === 'string' && key[0].endsWith('s')) {
        const singleItemQueryKey = [key[0].slice(0, -1), (data as any).id];
        queryClient.invalidateQueries({ queryKey: singleItemQueryKey });
      }
      
      if (customOnSuccess) {
        customOnSuccess(data);
      }
    },
    ...restOptions,
  });
}