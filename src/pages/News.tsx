import { MainLayout } from "@/components/MainLayout";
import { usePublishedArticles } from "@/hooks/use-articles";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const News = () => {
  const { data: articles, isLoading, error } = usePublishedArticles();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">News</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-6">News</h1>
          <p className="text-destructive">Errore nel caricamento delle notizie.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">News</h1>
        
        {!articles || articles.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">Nessuna notizia al momento.</p>
            <p className="text-muted-foreground">Torna più tardi per gli ultimi aggiornamenti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Card key={article.id} className="flex flex-col">
                <Link to={`/news/${article.slug}`}>
                  <img
                    src={article.cover_image_url || 'https://placehold.co/600x400/e2e8f0/e2e8f0'}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </Link>
                <CardHeader>
                  <CardTitle className="text-xl leading-tight">
                    <Link to={`/news/${article.slug}`} className="hover:text-primary transition-colors">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground pt-1">
                    <span>
                      {article.published_at ? format(new Date(article.published_at), "dd MMMM yyyy", { locale: it }) : ''}
                    </span>
                    {article.profiles && (
                      <span> • Di {article.profiles.first_name} {article.profiles.last_name}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {article.content?.substring(0, 150) || 'Nessuna anteprima disponibile.'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Link to={`/news/${article.slug}`} className="w-full">
                    <Button variant="secondary" className="w-full">Leggi tutto</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default News;