import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Match, Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Trophy, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/lib/supabase/auth-context";

type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

const Matches = () => {
  const { user } = useAuth();
  const { data: matches, isLoading, error } = useSupabaseQuery<MatchWithTeams[]>(
    ['matches-with-teams'],
    async () => supabase
      .from('matches')
      .select(`
        *,
        venues(name),
        home_teams:teams!matches_home_team_id_fkey (
          id,
          name,
          logo_url
        ),
        away_teams:teams!matches_away_team_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .order('match_date', { ascending: true })
  );

  const upcomingMatches = matches?.filter(match => 
    match.status === 'scheduled' || match.status === 'ongoing'
  ) || [];

  const completedMatches = matches?.filter(match => 
    match.status === 'completed'
  ) || [];

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

  const MatchCard = ({ match }: { match: MatchWithTeams }) => (
    <div className="relative group">
      <Link to={`/matches/${match.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(match.match_date), 'dd MMM yyyy', { locale: it })}
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(new Date(match.match_date), 'HH:mm')}
                </span>
              </div>
              {getStatusBadge(match.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1">
                {match.home_teams.logo_url ? (
                  <img 
                    src={match.home_teams.logo_url} 
                    alt={`${match.home_teams.name} logo`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="font-medium text-sm sm:text-base">{match.home_teams.name}</span>
              </div>

              {/* Score */}
              <div className="px-4">
                {match.status === 'completed' ? (
                  <div className="text-xl sm:text-2xl font-bold text-center">
                    {match.home_score} - {match.away_score}
                  </div>
                ) : (
                  <div className="text-lg text-muted-foreground text-center">
                    vs
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="font-medium text-sm sm:text-base">{match.away_teams.name}</span>
                {match.away_teams.logo_url ? (
                  <img 
                    src={match.away_teams.logo_url} 
                    alt={`${match.away_teams.name} logo`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            </div>

            {match.venues?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{match.venues.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Admin Quick Actions */}
      {user && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Link to={`/admin/fixtures/${match.id}/edit`}>
              <Button 
                size="sm" 
                variant="secondary" 
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                onClick={(e) => e.preventDefault()}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </Link>
            <Link to={`/admin/fixtures/${match.id}`}>
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
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Matches</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/fixtures/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova partita
                </Button>
              </Link>
              <Link to="/admin/fixtures">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl md:text-3xl font-bold">Matches</h1>
          {user && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/admin/fixtures/new">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova partita
                </Button>
              </Link>
              <Link to="/admin/fixtures">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Gestisci
                </Button>
              </Link>
            </div>
          )}
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Errore nel caricamento delle partite</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Matches</h1>
        {user && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/admin/fixtures/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuova partita
              </Button>
            </Link>
            <Link to="/admin/fixtures">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Gestisci
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Prossime ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completate ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-2">Nessuna partita in programma</p>
              <p className="text-muted-foreground mb-4">Le prossime partite verranno visualizzate qui.</p>
              {user && (
                <Link to="/admin/fixtures/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi prima partita
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedMatches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-2">Nessuna partita completata</p>
              <p className="text-muted-foreground">I risultati delle partite verranno visualizzati qui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Matches;