import { AdminLayout } from "@/components/admin/AdminLayout";
import { EntityCard } from "@/components/EntityCard";
import { usePlayer } from "@/hooks/use-players";
import { useParams, Link } from "react-router-dom";
import { Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const PlayerDetailsAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const { data: player, isLoading, error } = usePlayer(id);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !player) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Giocatore non trovato</h1>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Il giocatore richiesto non esiste."}
          </p>
          <Link to="/admin/players">
            <Button variant="outline">Torna ai giocatori</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const subtitle = [
    player.role,
    player.teams?.name
  ].filter(Boolean).join(" | ");

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dettagli Giocatore</h1>
        <Link to={`/admin/players/${player.id}/edit`}>
          <Button className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Modifica
          </Button>
        </Link>
      </div>
      <EntityCard
        title={`${player.first_name} ${player.last_name}`}
        subtitle={subtitle}
        imageUrl={player.photo_url || undefined}
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Data di nascita: </span>
            {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('it-IT') : 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Nazionalità: </span>
            {player.nationality || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Numero maglia: </span>
            {player.jersey_number || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Documento ID: </span>
            {player.document_id || 'N/A'}
          </div>
           <div>
            <span className="font-semibold">Squadra: </span>
            {player.teams?.name || 'Nessuna squadra'}
          </div>
        </div>
      </EntityCard>
    </AdminLayout>
  );
};

export default PlayerDetailsAdmin;