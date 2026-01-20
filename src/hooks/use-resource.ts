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

  function useList() {
    return useSupabaseQuery<T[]>(
      [queryKey],
      async () => supabase
        .from(tableName)
        .select(selectQuery)
        .order(orderBy.column, { ascending: orderBy.ascending ?? true })
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
    useById,
    useCreate,
    useUpdate,
    useDelete,
  };
}
