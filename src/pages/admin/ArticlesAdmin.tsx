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

const ArticlesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: articles, isLoading, error } = useArticles();
  const deleteArticleMutation = useDeleteArticle();
  const togglePinMutation = useTogglePinArticle();

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
    { key: "pin", label: "" },
    { key: "title", label: "Titolo" },
    { key: "status", label: "Stato" },
    { key: "author", label: "Autore" },
    { key: "published_at", label: "Pubblicato il" },
    { key: "actions", label: "Azioni" },
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
          <p>{article.is_pinned ? "Sblocca articolo" : "Fissa articolo in cima"}</p>
        </TooltipContent>
      </Tooltip>
    ),
    title: article.title,
    status: (
      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
        {article.status === 'published' ? 'Pubblicato' : 'Bozza'}
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
              <AlertDialogTitle>Elimina articolo</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare l'articolo "{article.title}"? 
                Questa azione non può essere annullata.
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
          <p className="text-red-600 mb-4">Errore nel caricamento degli articoli</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Articoli</h1>
        <Link to="/admin/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo articolo
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca articoli..."
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
        <Table columns={columns} data={data} />
      )}
    </AdminLayout>
  );
};

export default ArticlesAdmin;