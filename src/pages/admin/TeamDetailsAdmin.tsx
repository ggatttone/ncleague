import { AdminLayout } from "@/components/admin/AdminLayout";
import { EntityCard } from "@/components/EntityCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeam } from "@/hooks/use-teams";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Player } from "@/types/database";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Edit, Users, ArrowLeft } from "lucide-react";

const TeamDetailsAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(id);
  
  const { data: players, isLoading: playersLoading } = useSupabaseQuery<Player[]>(
    ['team-players', id],
    async () => supabase.from('players').select('*').eq('team_id', id).order('jersey_number'),
    { enabled: !!id }
  );

  if (teamLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (teamError || !team) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Squadra non trovata</h1>
          <p className="text-muted-foreground mb-4">
            {teamError?.message || "La squadra richiesta non esiste."}
          </p>
          <Button onClick={() => navigate("/admin/teams")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle squadre
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button 
          onClick={() => navigate("/admin/teams")} 
          variant="outline" 
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alle squadre
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Dettagli Squadra</h1>
        <Link to={`/admin/teams/${team.id}/edit`}>
          <Button className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Modifica
          </Button>
        </Link>
      </div>

      <EntityCard
        title={team.name}
        subtitle={[
          team.parish && `Parrocchia: ${team.parish}`,
          team.venues?.name && `Campo: ${team.venues.name}`
        ].filter(Boolean).join(" | ")}
        imageUrl={team.logo_url}
      >
        <div className="mt-2 space-y-1">
          {team.colors && (
            <div className="text-sm">
              <span className="font-medium">Colori:</span> {team.colors}
            </div>
          )}
          <div className="text-sm">
            <span className="font-medium">Giocatori:</span> {players?.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">
            Creata il: {new Date(team.created_at).toLocaleDateString('it-IT')}
          </div>
        </div>
      </EntityCard>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rosa ({players?.length || 0} giocatori)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !players || players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nessun giocatore registrato per questa squadra</p>
              <Link to="/admin/players/new">
                <Button variant="outline">
                  Aggiungi primo giocatore
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm font-semibold">
                      {player.jersey_number || '?'}
                    </div>
                    <div>
                      <div className="font-medium">
                        {player.first_name} {player.last_name}
                      </div>
                      {player.role && (
                        <div className="text-sm text-muted-foreground">{player.role}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.date_of_birth && (
                      <div className="text-sm text-muted-foreground">
                        {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} anni
                      </div>
                    )}
                    <Link to={`/admin/players/${player.id}`}>
                      <Button variant="ghost" size="sm">
                        Dettagli
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default TeamDetailsAdmin;