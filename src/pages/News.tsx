import { MainLayout } from "@/components/MainLayout";
import { usePublishedArticles } from "@/hooks/use-articles";
import { ArticlePostCard } from "@/components/ArticlePostCard";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { NewsComposer } from "@/components/news/NewsComposer";

const News = () => {
  const { data: articles, isLoading, error } = usePublishedArticles();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const canCreate = hasPermission(['admin', 'editor']);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-14">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-14 px-4">
          <p className="text-destructive">{t('errors.loadingNews')}</p>
        </div>
      );
    }

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-16 px-4">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">{t('pages.news.noNewsTitle')}</h2>
          <p className="text-muted-foreground mt-1">{t('pages.news.noNewsSubtitle')}</p>
        </div>
      );
    }

    return (
      <div>
        {articles.map(article => (
          <ArticlePostCard key={article.id} article={article} />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-0 sm:px-4 py-6 sm:py-8">
        <div className="px-4 sm:px-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('pages.news.title')}</h1>
          {canCreate && (
            <Link to="/admin/articles/new" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('pages.news.composer.advancedEditor')}
              </Button>
            </Link>
          )}
        </div>

        {canCreate && (
          <div className="px-4 sm:px-0 mb-4">
            <NewsComposer />
          </div>
        )}

        <div className="border-y sm:border rounded-none sm:rounded-xl overflow-hidden bg-card">
          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
};

export default News;
