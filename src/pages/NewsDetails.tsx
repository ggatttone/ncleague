import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { usePublishedArticleBySlug } from "@/hooks/use-articles";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { LikeButton } from "@/components/LikeButton";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import { useTranslation } from "react-i18next";
import { getOptimizedImageUrl } from "@/lib/image";

const NewsDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = usePublishedArticleBySlug(slug);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !article) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('pages.newsDetails.notFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('pages.newsDetails.notFoundSubtitle')}</p>
          <Link to="/news">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('pages.newsDetails.backToNews')}
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/news" className="mb-8 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pages.newsDetails.allNews')}
          </Button>
        </Link>

        <article>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            {article.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(article.published_at), "dd MMMM yyyy", { locale: it })}</span>
              </div>
            )}
            {article.profiles && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.profiles.first_name} {article.profiles.last_name}</span>
              </div>
            )}
          </div>

          {article.cover_image_url && (
            <img
              src={getOptimizedImageUrl(article.cover_image_url, { width: 800 })}
              alt={article.title}
              className="w-full h-auto max-h-96 object-cover rounded-lg mb-8"
            />
          )}

          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {article.content}
          </div>
        </article>

        <Separator className="my-8" />

        <div className="flex items-center gap-4">
          <LikeButton articleId={article.id} />
        </div>

        <div id="comments" className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t('pages.newsDetails.comments')}</h2>
          <CommentForm articleId={article.id} />
          <CommentList articleId={article.id} />
        </div>
      </div>
    </MainLayout>
  );
};

export default NewsDetails;