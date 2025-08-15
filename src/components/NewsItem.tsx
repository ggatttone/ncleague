import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArticleWithAuthor } from "@/hooks/use-articles";
import { formatDateRelative, getInitials } from "@/lib/utils";

interface NewsItemProps {
  article: ArticleWithAuthor;
}

export const NewsItem = ({ article }: NewsItemProps) => {
  const authorName = `${article.profiles?.first_name || ''} ${article.profiles?.last_name || ''}`.trim() || 'Autore';
  const relativeDate = formatDateRelative(article.published_at);

  return (
    <Link to={`/news/${article.slug}`} className="block p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(article.profiles?.first_name, article.profiles?.last_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold">{article.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{authorName}</span>
            <span>·</span>
            <span>{relativeDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};