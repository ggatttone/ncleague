import { memo } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Pin } from "lucide-react";
import { ArticleWithAuthor } from "@/hooks/use-articles";
import { formatDateRelative, getInitials } from "@/lib/utils";
import { useSupabaseCountQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { LikeButton } from "@/components/LikeButton";
import { useTranslation } from "react-i18next";

interface ArticlePostCardProps {
  article: ArticleWithAuthor;
}

export const ArticlePostCard = memo(({ article }: ArticlePostCardProps) => {
  const { t } = useTranslation();
  const authorName =
    `${article.profiles?.first_name || ''} ${article.profiles?.last_name || ''}`.trim() ||
    t("pages.news.unknownAuthor");
  const relativeDate = formatDateRelative(article.published_at);
  const bodyText = article.content?.trim() || article.title;

  const { data: commentCount } = useSupabaseCountQuery(
    ['comments', article.id, 'count'],
    async () => supabase.from('comments').select('*', { count: 'exact', head: true }).eq('article_id', article.id)
  );

  return (
    <article className="border-b border-border p-4 sm:p-5 transition-colors hover:bg-muted/25">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(article.profiles?.first_name, article.profiles?.last_name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {article.is_pinned && (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <Pin className="h-3.5 w-3.5" />
              <span>{t("pages.news.pinned")}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">{authorName}</span>
            <span className="text-muted-foreground">·</span>
            <Link to={`/news/${article.slug}`} className="text-muted-foreground hover:underline">
              {relativeDate}
            </Link>
          </div>

          <Link to={`/news/${article.slug}`} className="mt-1 block">
            {article.title && article.title !== bodyText && (
              <h2 className="mb-1 text-sm font-semibold text-foreground/80">{article.title}</h2>
            )}
            <p className="whitespace-pre-wrap text-[15px] leading-6 text-foreground">{bodyText}</p>
          </Link>

          {article.cover_image_url && (
            <Link to={`/news/${article.slug}`} className="mt-3 block overflow-hidden rounded-2xl border">
              <img
                src={article.cover_image_url}
                alt={article.title}
                loading="lazy"
                className="h-auto max-h-96 w-full object-cover"
              />
            </Link>
          )}

          <div className="mt-3 flex items-center gap-2 text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-500">
              <Link to={`/news/${article.slug}#comments`} className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{commentCount || 0}</span>
              </Link>
            </Button>
            <LikeButton articleId={article.id} />
          </div>
        </div>
      </div>
    </article>
  );
});
