import { MainLayout } from "@/components/MainLayout";
import { usePublishedArticles } from "@/hooks/use-articles";
import { ArticlePostCard } from "@/components/ArticlePostCard";
import { Loader2, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const News = () => {
  const { data: articles, isLoading, error } = usePublishedArticles();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(['admin', 'editor']);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <p className="text-destructive">Errore nel caricamento delle notizie.</p>
        </div>
      );
    }

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-20">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Nessuna notizia al momento.</h2>
          <p className="text-muted-foreground mt-2">Torna più tardi per gli ultimi aggiornamenti.</p>
        </div>
      );
    }

    return (
      <div className="border-t">
        {articles.map(article => (
          <ArticlePostCard key={article.id} article={article} />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-0 sm:px-4 py-8 max-w-2xl">
        <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Feed</h1>
          {canCreate && (
            <Link to="/admin/articles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Post
              </Button>
            </Link>
          )}
        </div>
        {renderContent()}
      </div>
    </MainLayout>
  );
};

export default News;