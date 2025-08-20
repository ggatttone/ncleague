import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArticles, useDeleteArticle, useTogglePinArticle } from "@/hooks/use-articles";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Search, Loader2, Plus, Edit, Trash2, Pin, PinOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { showSuccess } from "@/utils/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";
import { useTranslation } from "react-i18next";

const ArticlesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: articles, isLoading, error } = useArticles();
  const deleteArticleMutation = useDeleteArticle();
  const togglePinMutation = useTogglePinArticle();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await togglePinMutation.mutateAsync({ id, is_pinned: !isPinned }, {
      onSuccess: () => {
        showSuccess(`Articolo ${!isPinned ? 'fissato' : 'sbloccato'} con successo.`);
      }
    });
  };

  const filteredArticles = useMemo(() => {
    if (!articles || !searchTerm) return articles;
    
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

  const handleDelete = async (id: string) => {
    await deleteArticleMutation.mutateAsync(id);
  };

  const columns = [
    { key: "pin", label: t('pages.admin.articles.table.pin') },
    { key: "title", label: t('pages.admin.articles.table.title') },
    { key: "status", label: t('pages.admin.articles.table.status') },
    { key: "author", label: t('pages.admin.articles.table.author') },
    { key: "published_at", label: t('pages.admin.articles.table.publishedAt') },
    { key: "actions", label: t('pages.admin.articles.table.actions') },
  ];

  const data = filteredArticles?.map(article => ({
    pin: (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleTogglePin(article.id, article.is_pinned)}
            disabled={togglePinMutation.isPending}
          >
            {article.is_pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{article.is_pinned ? t('pages.admin.articles.unpinTooltip') : t('pages.admin.articles.pinTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    ),
    title: article.title,
    status: (
      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
        {t(`pages.admin.articles.status.${article.status}`)}
      </Badge>
    ),
    author: `${article.profiles?.first_name || ''} ${article.profiles?.last_name || ''}`.trim() || 'N/A',
    published_at: article.published_at ? format(new Date(article.published_at), "dd MMM yyyy", { locale: it }) : '-',
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/articles/${article.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pages.admin.articles.deleteDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pages.admin.articles.deleteDialogDescription', { name: article.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(article.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteArticleMutation.isPending}
              >
                {deleteArticleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    ),
  })) || [];

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('pages.admin.articles.errorLoading')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {filteredArticles?.map(article => {
        const actions = (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePin(article.id, article.is_pinned)} disabled={togglePinMutation.isPending}>
                  {article.is_pinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{article.is_pinned ? t('pages.admin.articles.unpinTooltip') : t('pages.admin.articles.pinTooltip')}</p></TooltipContent>
            </Tooltip>
            <Link to={`/admin/articles/${article.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('pages.admin.articles.deleteDialogTitle')}</AlertDialogTitle><AlertDialogDescription>{t('pages.admin.articles.deleteDialogDescription', { name: article.title })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(article.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteArticleMutation.isPending}>
                    {deleteArticleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        const author = `${article.profiles?.first_name || ''} ${article.profiles?.last_name || ''}`.trim() || 'N/A';
        return (
          <AdminMobileCard
            key={article.id}
            title={article.title}
            subtitle={author}
            actions={actions}
          >
            <div className="mt-2">
              <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                {t(`pages.admin.articles.status.${article.status}`)}
              </Badge>
            </div>
          </AdminMobileCard>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('pages.admin.articles.title')}</h1>
        <Link to="/admin/articles/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('pages.admin.articles.newArticle')}
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pages.admin.articles.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        isMobile ? renderMobileList() : <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default ArticlesAdmin;