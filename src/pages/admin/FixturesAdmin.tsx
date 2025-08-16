import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";
import { useMatches, useDeleteMatch } from "@/hooks/use-matches";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus, Edit, Trash2, Upload } from "lucide-react";
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

const FixturesAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: matches, isLoading, error } = useMatches();
  const deleteMatchMutation = useDeleteMatch();

  const filteredMatches = useMemo(() => {
    if (!matches || !searchTerm) return matches;
    
    return matches.filter(match => 
      match.home_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_teams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venues?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatchMutation.mutateAsync(matchId);
    } catch (error) {
      console.error(`Error deleting match:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Programmata</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-green-600">In corso</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completata</Badge>;
      case 'postponed':
        return <Badge variant="destructive">Rinviata</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancellata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns = [
    { key: "match", label: "Partita" },
    { key: "date", label: "Data" },
    { key: "status", label: "Stato" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredMatches?.map(match => ({
    match: (
      <Link to={`/admin/fixtures/${match.id}`} className="text-primary underline hover:text-primary/80">
        {match.home_teams.name} vs {match.away_teams.name}
      </Link>
    ),
    date: format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: it }),
    status: getStatusBadge(match.status),
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/fixtures/${match.id}/edit`}>
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
              <AlertDialogTitle>Elimina partita</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la partita "{match.home_teams.name} vs {match.away_teams.name}"? 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteMatch(match.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMatchMutation.isPending}
              >
                {deleteMatchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento delle partite</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendario Partite</h1>
        <div className="flex items-center gap-2">
          <Link to="/admin/fixtures/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importa da File
            </Button>
          </Link>
          <Link to="/admin/fixtures/new/bulk">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Inserimento Multiplo
            </Button>
          </Link>
          <Link to="/admin/fixtures/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuova partita
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca partite..."
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

export default FixturesAdmin;