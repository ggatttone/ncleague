import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSeasons, useDeleteSeason } from "@/hooks/use-seasons";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Search, Loader2, Plus, Edit, Trash2 } from "lucide-react";
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

const SeasonsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: seasons, isLoading, error } = useSeasons();
  const deleteSeasonMutation = useDeleteSeason();

  const filteredSeasons = useMemo(() => {
    if (!seasons || !searchTerm) return seasons;
    
    return seasons.filter(season => 
      season.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [seasons, searchTerm]);

  const handleDelete = async (id: string) => {
    await deleteSeasonMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "start_date", label: "Data Inizio" },
    { key: "end_date", label: "Data Fine" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredSeasons?.map(season => ({
    name: season.name,
    start_date: season.start_date ? new Date(season.start_date).toLocaleDateString('it-IT') : "-",
    end_date: season.end_date ? new Date(season.end_date).toLocaleDateString('it-IT') : "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/seasons/${season.id}/edit`}>
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
              <AlertDialogTitle>Elimina stagione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la stagione "{season.name}"? 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(season.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteSeasonMutation.isPending}
              >
                {deleteSeasonMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento delle stagioni</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stagioni</h1>
        <Link to="/admin/seasons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova stagione
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca stagioni..."
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

export default SeasonsAdmin;