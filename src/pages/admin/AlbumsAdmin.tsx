import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useAlbums, useDeleteAlbum } from "@/hooks/use-albums";
import { Link } from "react-router-dom";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileCard } from "@/components/admin/AdminMobileCard";

const AlbumsAdmin = () => {
  const { data: albums, isLoading, error } = useAlbums();
  const deleteAlbumMutation = useDeleteAlbum();
  const isMobile = useIsMobile();

  const handleDelete = async (id: string) => {
    await deleteAlbumMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "item_count", label: "N. Elementi" },
    { key: "created_at", label: "Creato il" },
    { key: "actions", label: "Azioni" },
  ];

  const data = albums?.map(album => ({
    name: album.name,
    item_count: <div className="text-center">{album.item_count}</div>,
    created_at: new Date(album.created_at).toLocaleDateString('it-IT'),
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/albums/${album.id}/edit`}>
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
              <AlertDialogTitle>Elimina album</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare l'album "{album.name}"? 
                Le immagini al suo interno non verranno eliminate ma non saranno più associate a questo album.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(album.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteAlbumMutation.isPending}
              >
                {deleteAlbumMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento degli album</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  const renderMobileList = () => (
    <div className="space-y-4">
      {albums?.map(album => {
        const actions = (
          <>
            <Link to={`/admin/albums/${album.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></Link>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Elimina album</AlertDialogTitle><AlertDialogDescription>Sei sicuro di voler eliminare "{album.name}"?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(album.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteAlbumMutation.isPending}>
                    {deleteAlbumMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
        return (
          <AdminMobileCard
            key={album.id}
            title={album.name}
            subtitle={`${album.item_count} elementi`}
            actions={actions}
          />
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Album Galleria</h1>
        <Link to="/admin/albums/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Album
          </Button>
        </Link>
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

export default AlbumsAdmin;