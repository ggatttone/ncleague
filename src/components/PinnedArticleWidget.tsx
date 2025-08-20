import { useArticle } from "@/hooks/use-articles";
import { ArticlePostCard } from "@/components/ArticlePostCard";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface PinnedArticleWidgetProps {
  settings: {
    articleId?: string;
  };
}

export const PinnedArticleWidget = ({ settings }: PinnedArticleWidgetProps) => {
  const { articleId } = settings;
  const { data: article, isLoading } = useArticle(articleId);
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.pinnedArticle.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {!isLoading && !article && (
          <div className="text-center text-muted-foreground py-8 px-6">
            <p>{t('components.pinnedArticle.noArticle')}</p>
          </div>
        )}
        {article && <ArticlePostCard article={article} />}
      </CardContent>
    </Card>
  );
};