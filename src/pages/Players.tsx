import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Player, Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

const Players = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const { data: playersData, isLoading, error } = useSupabaseQuery<(Player & { teams: Team })[]>(
    ['players-with-teams'],
    () => supabase
      .from('players')
      .select(`
        *,
        teams (
          id,
          name,
          logo_url
        )
      `)
      .order('last_name')
  );

  const filteredPlayers = useMemo(() => {
    if (!playersData || !searchTerm) return playersData;
    
    return playersData.filter(player => 
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.teams?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [playersData, searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Players</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/players/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo giocatore
                </Button>
              </Link>
              <Link to="/admin/players">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="mb-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Players</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/players/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo giocatore
                </Button>
              </Link>
              <Link to="/admin/players">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento dei giocatori</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Players</h1>
        {user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/admin/players/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuovo giocatore
              </Button>
            </Link>
            <Link to="/admin/players">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Gestisci
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca giocatori, squadre o ruoli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!filteredPlayers || filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">
            {searchTerm ? "Nessun giocatore trovato" : "Nessun giocatore registrato"}
          </p>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Prova a modificare i termini di ricerca." : "I giocatori verranno visualizzati qui una volta aggiunti."}
          </p>
          {user && !searchTerm && (
            <Link to="/admin/players/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi primo giocatore
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredPlayers.length} giocator{filteredPlayers.length === 1 ? 'e' : 'i'} 
            {searchTerm && ` trovato per "${searchTerm}"`}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="relative group">
                <Link to={`/players/${player.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {player.jersey_number ? (
                            <span className="font-bold text-primary">{player.jersey_number}</span>
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {player.first_name} {player.last_name}
                          </CardTitle>
                          {player.teams && (
                            <p className="text-sm text-muted-foreground truncate">{player.teams.name}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {player.role && (
                          <Badge variant="secondary" className="text-xs">
                            {player.role}
                          </Badge>
                        )}
                        {player.date_of_birth && (
                          <div className="text-sm text-muted-foreground">
                            {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} anni
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Admin Quick Actions */}
                {user && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Link to={`/admin/players/${player.id}/edit`}>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link to={`/admin/players/${player.id}`}>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 px-2 bg-white/90 hover:bg-white shadow-sm text-xs"
                          onClick={(e) => e.preventDefault()}
                        >
                          Admin
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Players;