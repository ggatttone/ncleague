import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import { SeasonDraft, SeasonDraftData } from '@/types/database';

export interface CreateDraftData {
  name?: string;
  current_step?: number;
  draft_data: SeasonDraftData;
  season_id?: string;
}

export interface UpdateDraftData {
  id: string;
  name?: string;
  current_step?: number;
  draft_data?: SeasonDraftData;
  season_id?: string;
}

/**
 * Hook to fetch all drafts for the current user
 */
export function useSeasonDrafts() {
  const { user } = useAuth();

  return useSupabaseQuery<SeasonDraft[]>(
    ['season-drafts', user?.id],
    async () => {
      if (!user?.id) return { data: [], error: null };
      return supabase
        .from('season_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    },
    { enabled: !!user?.id }
  );
}

/**
 * Hook to fetch a single draft by ID
 */
export function useSeasonDraft(id: string | undefined) {
  const { user } = useAuth();

  return useSupabaseQuery<SeasonDraft>(
    ['season-draft', id],
    async () => {
      if (!id || !user?.id) return null;
      return supabase
        .from('season_drafts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
    },
    { enabled: !!id && !!user?.id }
  );
}

/**
 * Hook to create a new draft
 */
export function useCreateDraft() {
  const { user } = useAuth();

  return useSupabaseMutation<SeasonDraft, CreateDraftData>(
    ['season-drafts'],
    async (data) => {
      if (!user?.id) throw new Error('User not authenticated');

      return supabase
        .from('season_drafts')
        .insert([{
          user_id: user.id,
          name: data.name,
          current_step: data.current_step ?? 1,
          draft_data: data.draft_data,
          season_id: data.season_id,
        }])
        .select()
        .single();
    }
  );
}

/**
 * Hook to update an existing draft
 */
export function useUpdateDraft() {
  const { user } = useAuth();

  return useSupabaseMutation<SeasonDraft, UpdateDraftData>(
    ['season-drafts'],
    async ({ id, ...data }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.current_step !== undefined) updateData.current_step = data.current_step;
      if (data.draft_data !== undefined) updateData.draft_data = data.draft_data;
      if (data.season_id !== undefined) updateData.season_id = data.season_id;

      return supabase
        .from('season_drafts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
    }
  );
}

/**
 * Hook to delete a draft
 */
export function useDeleteDraft() {
  const { user } = useAuth();

  return useSupabaseMutation<void, string>(
    ['season-drafts'],
    async (id) => {
      if (!user?.id) throw new Error('User not authenticated');

      return supabase
        .from('season_drafts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    }
  );
}
