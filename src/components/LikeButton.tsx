import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-context";
import { useArticleLikes, useAddLike, useRemoveLike } from "@/hooks/use-interactions";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export const LikeButton = ({ articleId }: { articleId: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: likesData, isLoading } = useArticleLikes(articleId);
  const addLikeMutation = useAddLike();
  const removeLikeMutation = useRemoveLike();

  const handleLike = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (likesData?.isLiked && likesData.userLikeId) {
      removeLikeMutation.mutate(likesData.userLikeId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['likes', articleId] });
        }
      });
    } else {
      addLikeMutation.mutate({ article_id: articleId, user_id: user.id });
    }
  };

  const isLiked = likesData?.isLiked || false;
  const likeCount = likesData?.count || 0;
  const isMutating = addLikeMutation.isPending || removeLikeMutation.isPending;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 hover:text-red-500"
      onClick={handleLike}
      disabled={isLoading || isMutating}
    >
      <Heart
        className={cn("h-5 w-5", isLiked ? "text-red-500 fill-current" : "")}
      />
      <span className="text-xs">{likeCount}</span>
    </Button>
  );
};