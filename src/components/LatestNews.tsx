import { usePublishedArticles } from "@/hooks/use-articles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { NewsItem } from "@/components/NewsItem";

export const LatestNews = () => {
  const { data: articles, isLoading } = usePublishedArticles();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ultime Notizie</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-6">
            <p>Nessuna notizia pubblicata.</p>
          </div>
        ) : (
          <div>
            {articles.slice(0, 2).map(article => (
              <NewsItem key={article.id} article={article} />
            ))}
          </div>
        )}
      </CardContent>
      <div className="p-6 pt-2 text-center">
        <Button asChild variant="outline" size="sm">
          <Link to="/news">Leggi tutte le notizie</Link>
        </Button>
      </div>
    </Card>
  );
};