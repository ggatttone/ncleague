import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table } from "@/components/Table";
import { Link } from "react-router-dom";
import { usePlayers, useDeletePlayer } from "@/hooks/use-players";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PlayersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: players, isLoading, error } = usePlayers();
  const deletePlayerMutation = useDeletePlayer();

  const filteredPlayers = useMemo(() => {
    if (!players || !searchTerm) return players;
    
    return players.filter(player => 
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.teams?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayerMutation.mutateAsync(playerId);
    } catch (error) {
      console.error(`Error deleting player:`, error);
    }
  };

  const columns = [
    { key: "name", label: "Nome" },
    { key: "team", label: "Squadra" },
    { key: "role", label: "Ruolo" },
    { key: "actions", label: "Azioni" },
  ];

  const data = filteredPlayers?.map(player => ({
    name: (
      <Link to={`/admin/players/${player.id}`} className="text-primary underline hover:text-primary/80">
        {player.first_name} {player.last_name}
      </Link>
    ),
    team: player.teams ? (
      <Link to={`/admin/teams/${player.teams.id}`} className="underline">
        {player.teams.name}
      </Link>
    ) : "-",
    role: player.role || "-",
    actions: (
      <div className="flex items-center gap-2">
        <Link to={`/admin/players/${player.id}/edit`}>
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
              <AlertDialogTitle>Elimina giocatore</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare il giocatore "{player.first_name} {player.last_name}"? 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeletePlayer(player.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletePlayerMutation.isPending}
              >
                {deletePlayerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          <p className="text-red-600 mb-4">Errore nel caricamento dei giocatori</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Giocatori</h1>
        <Link to="/admin/players/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo giocatore
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca giocatori..."
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
          {filteredPlayers && filteredPlayers.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredPlayers.length} giocator{filteredPlayers.length === 1 ? 'e' : 'i'} 
              {searchTerm && ` trovati per "${searchTerm}"`}
            </div>
          )}
          <Table columns={columns} data={data} />
        </>
      )}
    </AdminLayout>
  );
};

export default PlayersAdmin;