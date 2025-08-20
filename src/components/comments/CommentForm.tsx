import { useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useAddComment } from '@/hooks/use-interactions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const CommentForm = ({ articleId }: { articleId: string }) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const addCommentMutation = useAddComment();
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    addCommentMutation.mutate(
      { article_id: articleId, user_id: user.id, content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
        },
      }
    );
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-4 mt-6">
      <Avatar>
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback>{getInitials(profile?.first_name, profile?.last_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <Textarea
          placeholder={t('components.comments.writeComment')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mb-2"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!content.trim() || addCommentMutation.isPending}>
            {addCommentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('components.comments.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
};