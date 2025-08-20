import { useLatestArticles } from "@/hooks/use-articles";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticlePostCard } from "@/components/ArticlePostCard";
import { useTranslation } from "react-i18next";

export const LatestNews = () => {
  const { data: articles, isLoading } = useLatestArticles();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.latestNews.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-6">
            <p>{t('pages.news.noNews')}</p>
          </div>
        ) : (
          <div className="border-t">
            {articles.slice(0, 3).map(article => (
              <ArticlePostCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 justify-center">
        <Button asChild variant="outline" size="sm">
          <Link to="/news">{t('components.latestNews.readAll')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};