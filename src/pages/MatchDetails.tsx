import { useParams, Link } from "react-router-dom";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Match, Team, Goal, Player } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Clock, Target, Trophy } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

type GoalWithPlayer = Goal & {
  players: Player;
};

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: match, isLoading: matchLoading } = useSupabaseQuery<MatchWithTeams>(
    ['match', id],
    () => supabase
      .from('matches')
      .select(`
        *,
        home_teams:teams!matches_home_team_id_fkey (
          id,
          name,
          logo_url,
          colors
        ),
        away_teams:teams!matches_away_team_id_fkey (
          id,
          name,
          logo_url,
          colors
        )
      `)
      .eq('id', id)
      .single()
  );

  const { data: goals, isLoading: goalsLoading } = useSupabaseQuery<GoalWithPlayer[]>(
    ['match-goals', id],
    () => supabase
      .from('goals')
      .select(`
        *,
        players (
          id,
          first_name,
          last_name,
          jersey_number
        )
      `)
      .eq('match_id', id)
      .order('minute')
  );

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

  if (matchLoading) {
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

  if (!match) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Partita non trovata</h1>
          <Link to="/matches">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alle partite
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const homeGoals = goals?.filter(goal => goal.team_id === match.home_team_id) || [];
  const awayGoals = goals?.filter(goal => goal.team_id === match.away_team_id) || [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link to="/matches">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle partite
          </Button>
        </Link>
      </div>

      {/* Match Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">
                {format(new Date(match.match_date), 'dd MMMM yyyy', { locale: it })}
              </span>
              <Clock className="h-5 w-5 text-muted-foreground ml-2" />
              <span className="text-lg">
                {format(new Date(match.match_date), 'HH:mm')}
              </span>
            </div>
            {getStatusBadge(match.status)}
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1">
              {match.home_teams.logo_url ? (
                <img 
                  src={match.home_teams.logo_url} 
                  alt={`${match.home_teams.name} logo`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <Link to={`/teams/${match.home_teams.id}`}>
                  <h2 className="text-2xl font-bold hover:text-primary transition-colors">
                    {match.home_teams.name}
                  </h2>
                </Link>
                <p className="text-muted-foreground">Casa</p>
              </div>
            </div>

            {/* Score */}
            <div className="px-8">
              {match.status === 'completed' || match.status === 'ongoing' ? (
                <div className="text-6xl font-bold text-center">
                  {match.home_score} - {match.away_score}
                </div>
              ) : (
                <div className="text-4xl text-muted-foreground text-center">
                  vs
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1 justify-end text-right">
              <div>
                <Link to={`/teams/${match.away_teams.id}`}>
                  <h2 className="text-2xl font-bold hover:text-primary transition-colors">
                    {match.away_teams.name}
                  </h2>
                </Link>
                <p className="text-muted-foreground">Ospite</p>
              </div>
              {match.away_teams.logo_url ? (
                <img 
                  src={match.away_teams.logo_url} 
                  alt={`${match.away_teams.name} logo`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
          </div>

          {match.venue && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4">
              <MapPin className="h-4 w-4" />
              <span>{match.venue}</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Goals */}
      {(match.status === 'completed' || match.status === 'ongoing') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Marcatori ({goals?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !goals || goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun goal registrato per questa partita</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Team Goals */}
                <div>
                  <h3 className="font-semibold mb-3 text-center">{match.home_teams.name}</h3>
                  <div className="space-y-2">
                    {homeGoals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nessun goal</p>
                    ) : (
                      homeGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg border">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Target className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <Link to={`/players/${goal.players.id}`}>
                              <div className="font-medium hover:text-primary transition-colors">
                                {goal.players.first_name} {goal.players.last_name}
                                {goal.players.jersey_number && ` (#${goal.players.jersey_number})`}
                              </div>
                            </Link>
                            <div className="text-sm text-muted-foreground">{goal.minute}'</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Away Team Goals */}
                <div>
                  <h3 className="font-semibold mb-3 text-center">{match.away_teams.name}</h3>
                  <div className="space-y-2">
                    {awayGoals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Nessun goal</p>
                    ) : (
                      awayGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg border">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Target className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <Link to={`/players/${goal.players.id}`}>
                              <div className="font-medium hover:text-primary transition-colors">
                                {goal.players.first_name} {goal.players.last_name}
                                {goal.players.jersey_number && ` (#${goal.players.jersey_number})`}
                              </div>
                            </Link>
                            <div className="text-sm text-muted-foreground">{goal.minute}'</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchDetails;