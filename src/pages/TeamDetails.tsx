import { useParams, Link } from "react-router-dom";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Team, Player } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, ArrowLeft, Calendar } from "lucide-react";

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: team, isLoading: teamLoading } = useSupabaseQuery<Team>(
    ['team', id],
    () => supabase.from('teams').select('*').eq('id', id).single()
  );

  const { data: players, isLoading: playersLoading } = useSupabaseQuery<Player[]>(
    ['team-players', id],
    () => supabase.from('players').select('*').eq('team_id', id).order('jersey_number')
  );

  if (teamLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Squadra non trovata</h1>
          <Link to="/teams">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alle squadre
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link to="/teams">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle squadre
          </Button>
        </Link>
      </div>

      {/* Team Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-6">
            {team.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={`${team.name} logo`}
                className="w-24 h-24 rounded-full object-cover border-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2">
                <Users className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{team.name}</CardTitle>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {team.parish && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Parrocchia: {team.parish}</span>
                  </div>
                )}
                {team.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{team.venue}</span>
                  </div>
                )}
              </div>
              {team.colors && (
                <Badge variant="secondary" className="mt-2">
                  Colori: {team.colors}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Players Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rosa ({players?.length || 0} giocatori)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : !players || players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessun giocatore registrato per questa squadra</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <Link 
                  key={player.id} 
                  to={`/players/${player.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-sm font-semibold">
                    {player.jersey_number || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {player.first_name} {player.last_name}
                    </div>
                    {player.role && (
                      <div className="text-sm text-muted-foreground">{player.role}</div>
                    )}
                  </div>
                  {player.date_of_birth && (
                    <div className="text-sm text-muted-foreground">
                      {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} anni
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDetails;