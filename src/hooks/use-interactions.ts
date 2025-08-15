import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { Comment } from '@/types/database';

// Type for comments with author profile
export type CommentWithAuthor = Comment & {
  profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
};

// --- Likes ---

// Hook to get like count and user's like status for an article
export function useArticleLikes(articleId: string) {
  const { user } = useAuth();
  return useSupabaseQuery(
    ['likes', articleId],
    () => supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('article_id', articleId),
    {
      select: (data) => {
        const userLike = data?.find(like => like.user_id === user?.id);
        return {
          count: data?.length || 0,
          isLiked: !!userLike,
          userLikeId: userLike?.id,
        };
      },
      enabled: !!articleId,
    }
  );
}

// Hook to add a like
export function useAddLike() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ['likes'],
    (data: { article_id: string; user_id: string }) =>
      supabase.from('likes').insert(data).select().single(),
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.invalidateQueries({ queryKey: ['likes', data.article_id] });
        }
      },
    }
  );
}

// Hook to remove a like
export function useRemoveLike() {
  return useSupabaseMutation(
    ['likes'],
    (likeId: string) => supabase.from('likes').delete().eq('id', likeId)
  );
}


// --- Comments ---

// Hook to get comments for an article
export function useArticleComments(articleId: string) {
  return useSupabaseQuery<CommentWithAuthor[]>(
    ['comments', articleId],
    () => supabase
      .from('comments')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false }),
    { enabled: !!articleId }
  );
}

// Hook to add a comment
export function useAddComment() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ['comments'],
    (data: { article_id: string; user_id: string; content: string }) =>
      supabase.from('comments').insert(data).select().single(),
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.invalidateQueries({ queryKey: ['comments', data.article_id] });
          queryClient.invalidateQueries({ queryKey: ['comments', data.article_id, 'count'] });
        }
      },
    }
  );
}

// Hook to delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ['comments'],
    (commentId: string) => supabase.from('comments').delete().eq('id', commentId),
    {
      onSuccess: (data) => {
        // Invalidate after deletion
        if (data && (data as any).article_id) {
            queryClient.invalidateQueries({ queryKey: ['comments', (data as any).article_id] });
            queryClient.invalidateQueries({ queryKey: ['comments', (data as any).article_id, 'count'] });
        }
      }
    }
  );
}