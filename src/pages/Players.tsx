import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Player, Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const Players = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Players</h1>
        <div className="mb-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Players</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento dei giocatori</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Players</h1>
      
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
          <p className="text-muted-foreground">
            {searchTerm ? "Prova a modificare i termini di ricerca." : "I giocatori verranno visualizzati qui una volta aggiunti."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredPlayers.length} giocator{filteredPlayers.length === 1 ? 'e' : 'i'} 
            {searchTerm && ` trovato per "${searchTerm}"`}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => (
              <Link key={player.id} to={`/players/${player.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {player.jersey_number ? (
                          <span className="font-bold text-primary">{player.jersey_number}</span>
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {player.first_name} {player.last_name}
                        </CardTitle>
                        {player.teams && (
                          <p className="text-sm text-muted-foreground">{player.teams.name}</p>
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
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Players;