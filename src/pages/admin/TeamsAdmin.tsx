import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeams, useDeleteTeam } from "@/hooks/use-teams";
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

const TeamsAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: teams, isLoading, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();

  const filteredTeams = useMemo(() => {
    if (!teams || !searchTerm) return teams;
    
    return teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.parish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.venue?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    try {
      await deleteTeamMutation.mutateAsync(teamId);
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "parish", label: "Parrocchia" },
    { key: "venue", label: "Campo" },
    { key: "colors", label: "Colori" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredTeams?.map(team => ({
    name: (
      <Link to={`/admin/teams/${team.id}`} className="text-primary underline hover:text-primary/80">
        {team.name}
      </Link>
    ),
    parish: team.parish || "-",
    venue: team.venue || "-",
    colors: team.colors || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/teams/${team.id}/edit`}>
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
              <AlertDialogTitle>Elimina squadra</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare la squadra "{team.name}"? 
                Questa azione non può essere annullata e rimuoverà anche tutti i giocatori associati.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteTeam(team.id, team.name)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteTeamMutation.isPending}
              >
                {deleteTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento delle squadre</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Squadre</h1>
        <Link to="/admin/teams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova squadra
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca squadre..."
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
        <>
          {filteredTeams && filteredTeams.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredTeams.length} squadr{filteredTeams.length === 1 ? 'a' : 'e'} 
              {searchTerm && ` trovate per "${searchTerm}"`}
            </div>
          )}
          <Table columns={columns} data={data} />
        </>
      )}
    </AdminLayout>
  );
};

export default TeamsAdmin;