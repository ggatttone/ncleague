import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';

interface BaseEntity {
  id: string;
}

interface ResourceConfig<T extends BaseEntity, TCreate = Omit<T, 'id'>, TUpdate = Partial<TCreate> & { id: string }> {
  tableName: string;
  queryKey: string;
  selectQuery?: string;
  orderBy?: { column: string; ascending?: boolean };
  singularKey?: string;
}

interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 50;

export function createResourceHooks<
  T extends BaseEntity,
  TCreate = Omit<T, 'id'>,
  TUpdate = Partial<TCreate> & { id: string }
>(config: ResourceConfig<T, TCreate, TUpdate>) {
  const {
    tableName,
    queryKey,
    selectQuery = '*',
    orderBy = { column: 'name', ascending: true },
    singularKey = queryKey.slice(0, -1),
  } = config;

  function useList(options?: PaginationOptions) {
    const { page = 0, pageSize = DEFAULT_PAGE_SIZE } = options || {};
    const from = page * pageSize;
    const to = from + pageSize - 1;

    return useSupabaseQuery<T[]>(
      [queryKey, { page, pageSize }],
      async () => supabase
        .from(tableName)
        .select(selectQuery)
        .order(orderBy.column, { ascending: orderBy.ascending ?? true })
        .range(from, to) as unknown as Promise<{ data: T[] | null; error: import('@supabase/supabase-js').PostgrestError | null }>
    );
  }

  // For backwards compatibility - fetch all without pagination
  function useListAll() {
    return useSupabaseQuery<T[]>(
      [queryKey],
      async () => supabase
        .from(tableName)
        .select(selectQuery)
        .order(orderBy.column, { ascending: orderBy.ascending ?? true }) as unknown as Promise<{ data: T[] | null; error: import('@supabase/supabase-js').PostgrestError | null }>
    );
  }

  function useById(id: string | undefined) {
    return useSupabaseQuery<T>(
      [singularKey, id],
      async () => supabase
        .from(tableName)
        .select(selectQuery)
        .eq('id', id)
        .single(),
      { enabled: !!id }
    );
  }

  function useCreate() {
    return useSupabaseMutation<T, TCreate>(
      [queryKey],
      async (data: TCreate) => supabase
        .from(tableName)
        .insert([data as Record<string, unknown>])
        .select(selectQuery)
        .single()
    );
  }

  function useUpdate() {
    return useSupabaseMutation<T, TUpdate>(
      [queryKey],
      async ({ id, ...data }: TUpdate & { id: string }) => supabase
        .from(tableName)
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select(selectQuery)
        .single()
    );
  }

  function useDelete() {
    return useSupabaseMutation<void, string>(
      [queryKey],
      async (id: string) => supabase
        .from(tableName)
        .delete()
        .eq('id', id)
    );
  }

  return {
    useList,
    useListAll,
    useById,
    useCreate,
    useUpdate,
    useDelete,
  };
}
