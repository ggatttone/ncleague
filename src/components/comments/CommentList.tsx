import { useArticleComments, useDeleteComment, CommentWithAuthor } from '@/hooks/use-interactions';
import { useAuth } from '@/lib/supabase/auth-context';
import { Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDateRelative, getInitials } from '@/lib/utils';

const CommentItem = ({ comment }: { comment: CommentWithAuthor }) => {
  const { user, hasPermission } = useAuth();
  const deleteCommentMutation = useDeleteComment();
  const author = comment.profiles;
  const canDelete = user?.id === comment.user_id || hasPermission(['admin']);

  const handleDelete = () => {
    deleteCommentMutation.mutate({ commentId: comment.id, articleId: comment.article_id });
  };

  return (
    <div className="flex items-start gap-4 py-4">
      <Avatar>
        <AvatarImage src={author?.avatar_url || undefined} />
        <AvatarFallback>{getInitials(author?.first_name, author?.last_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm">{author?.first_name} {author?.last_name}</span>
            <span className="text-xs text-muted-foreground ml-2">{formatDateRelative(comment.created_at)}</span>
          </div>
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDelete} disabled={deleteCommentMutation.isPending}>
              {deleteCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-muted-foreground" />}
            </Button>
          )}
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
};

export const CommentList = ({ articleId }: { articleId: string }) => {
  const { data: comments, isLoading } = useArticleComments(articleId);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="mt-8 divide-y">
      {comments && comments.length > 0 ? (
        comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
      ) : (
        <p className="text-center text-muted-foreground py-8">Nessun commento. Sii il primo a commentare!</p>
      )}
    </div>
  );
};