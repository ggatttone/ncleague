import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Repeat, Share } from "lucide-react";
import { ArticleWithAuthor } from "@/hooks/use-articles";
import { formatDateRelative } from "@/lib/utils";

interface ArticlePostCardProps {
  article: ArticleWithAuthor;
}

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'N/A';
};

export const ArticlePostCard = ({ article }: ArticlePostCardProps) => {
  const authorName = `${article.profiles?.first_name || ''} ${article.profiles?.last_name || ''}`.trim() || 'Autore Sconosciuto';
  const relativeDate = formatDateRelative(article.published_at);

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden border-x-0 border-t-0 rounded-none last:border-b-0">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(article.profiles?.first_name, article.profiles?.last_name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">{authorName}</span>
              <span className="text-muted-foreground">·</span>
              <Link to={`/news/${article.slug}`} className="text-muted-foreground hover:underline">
                {relativeDate}
              </Link>
            </div>

            <Link to={`/news/${article.slug}`} className="block">
              <h2 className="text-lg font-semibold mt-1">{article.title}</h2>
              <p className="mt-2 text-foreground/90 whitespace-pre-wrap line-clamp-5">
                {article.content}
              </p>
            </Link>

            {article.cover_image_url && (
              <Link to={`/news/${article.slug}`} className="block mt-4">
                <img
                  src={article.cover_image_url}
                  alt={article.title}
                  className="w-full h-auto object-cover rounded-lg border"
                />
              </Link>
            )}

            <div className="flex items-center justify-between mt-4 text-muted-foreground">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">12</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-green-500">
                <Repeat className="h-5 w-5" />
                <span className="text-xs">5</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-red-500">
                <Heart className="h-5 w-5" />
                <span className="text-xs">34</span>
              </Button>
              <Button variant="ghost" size="sm" className="hover:text-blue-500">
                <Share className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};