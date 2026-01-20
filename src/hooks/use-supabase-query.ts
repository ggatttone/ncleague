import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseQueryResult, UseMutationOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';

type QueryKey = readonly unknown[];

interface ErrorWithMessage {
  message: string;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ErrorWithMessage).message;
  }
  return 'An unknown error occurred';
}

export function useSupabaseQuery<
  TQueryFnData,
  TError = PostgrestError,
  TData = TQueryFnData
>(
  key: QueryKey,
  query: () => PromiseLike<{ data: TQueryFnData | null; error: TError | null }> | null,
  options?: Omit<UseQueryOptions<TQueryFnData | null, TError, TData | null, QueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData | null, TError> {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const promise = query();
      if (!promise) return null;
      const { data, error } = await promise;
      if (error) {
        showError(getErrorMessage(error));
        throw error;
      }
      return data;
    },
    ...options,
  });
}

export function useSupabaseCountQuery<TData = unknown>(
  key: QueryKey,
  query: () => PromiseLike<{ data: TData; count: number | null; error: PostgrestError | null }> | null,
  options: Omit<UseQueryOptions<number | null, PostgrestError, number | null, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const promise = query();
      if (!promise) {
        return null;
      }
      const { count, error } = await promise;
      if (error) {
        showError(error.message);
        throw error;
      }
      return count;
    },
    ...options,
  });
}

interface WithId {
  id: string;
}

export function useSupabaseMutation<T, V = unknown>(
  key: string[],
  mutation: (variables: V) => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: Omit<UseMutationOptions<T | null, Error, V>, 'mutationFn'> = {}
) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation<T | null, Error, V>({
    mutationFn: async (variables: V) => {
      const { data, error } = await mutation(variables);
      if (error) {
        showError(error.message);
        throw error;
      }
      return data;
    },
    onSuccess: (data: T | null, variables: V, context: unknown) => {
      queryClient.invalidateQueries({ queryKey: key });

      const dataWithId = data as WithId | null;
      if (dataWithId?.id && key.length > 0 && typeof key[0] === 'string' && key[0].endsWith('s')) {
        const singleItemQueryKey = [key[0].slice(0, -1), dataWithId.id];
        queryClient.invalidateQueries({ queryKey: singleItemQueryKey });
      }

      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}