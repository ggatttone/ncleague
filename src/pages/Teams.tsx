import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/supabase/auth-context";

const Teams = () => {
  const { user } = useAuth();
  const { data: teams, isLoading, error } = useSupabaseQuery<Team[]>(
    ['teams'],
    () => supabase.from('teams').select('*, venues(*)').order('name')
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Clubs</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/teams/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova squadra
                </Button>
              </Link>
              <Link to="/admin/teams">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-2xl md:text-3xl font-bold">Clubs</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/teams/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova squadra
                </Button>
              </Link>
              <Link to="/admin/teams">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento delle squadre</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Clubs</h1>
        {user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/admin/teams/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuova squadra
              </Button>
            </Link>
            <Link to="/admin/teams">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Gestisci
                </Button>
            </Link>
          </div>
        )}
      </div>
      
      {!teams || teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">Nessuna squadra trovata</p>
          <p className="text-muted-foreground mb-4">Le squadre verranno visualizzate qui una volta aggiunte.</p>
          {user && (
            <Link to="/admin/teams/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi prima squadra
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {teams.map((team) => (
            <div key={team.id} className="relative group">
              <Link to={`/teams/${team.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={`${team.name} logo`}
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                        {team.parish && (
                          <p className="text-sm text-muted-foreground truncate">{team.parish}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {team.venues?.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{team.venues.name}</span>
                        </div>
                      )}
                      {team.colors && (
                        <Badge variant="secondary" className="text-xs">
                          {team.colors}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Admin Quick Actions */}
              {user && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Link to={`/admin/teams/${team.id}/edit`}>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link to={`/admin/teams/${team.id}`}>
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
      )}
    </div>
  );
};

export default Teams;