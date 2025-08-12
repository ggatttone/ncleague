import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompetitions, useDeleteCompetition } from "@/hooks/use-competitions";
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

const CompetitionsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: competitions, isLoading, error } = useCompetitions();
  const deleteCompetitionMutation = useDeleteCompetition();

  const filteredCompetitions = useMemo(() => {
    if (!competitions || !searchTerm) return competitions;
    
    return competitions.filter(comp => 
      comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [competitions, searchTerm]);

  const handleDelete = async (id: string) => {
    await deleteCompetitionMutation.mutateAsync(id);
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "slug", label: "Slug" },
    { key: "level", label: "Livello" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredCompetitions?.map(comp => ({
    name: comp.name,
    slug: comp.slug || "-",
    level: comp.level || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/competitions/${comp.id}/edit`}>
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
              <AlertDialogTitle>Elimina competizione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la competizione "{comp.name}"? 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(comp.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteCompetitionMutation.isPending}
              >
                {deleteCompetitionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento delle competizioni</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Competizioni</h1>
        <Link to="/admin/competitions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova competizione
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca competizioni..."
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

export default CompetitionsAdmin;