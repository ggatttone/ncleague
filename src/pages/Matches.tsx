import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Match, Team } from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Trophy, Plus, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { it } from "date-fns/locale";
import { useAuth } from "@/lib/supabase/auth-context";
import { useState, useEffect, useMemo } from "react";
import { useCompetitions } from "@/hooks/use-competitions";
import { useSeasons } from "@/hooks/use-seasons";
import { useTeams } from "@/hooks/use-teams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePlayoffBracket } from "@/hooks/use-playoffs";
import { cn, formatMatchDateLocal } from "@/lib/utils";

type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

const Matches = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>();
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>();
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>();

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();
  const { data: teams, isLoading: teamsLoading } = useTeams();

  useEffect(() => {
    if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
    if (!seasonsLoading && seasons?.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, selectedCompetition, selectedSeason]);

  const { data: matches, isLoading, error } = useSupabaseQuery<MatchWithTeams[]>(
    ['matches-with-teams', selectedCompetition, selectedSeason],
    async () => {
      if (!selectedCompetition || !selectedSeason) return null;
      return supabase
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
        .eq('competition_id', selectedCompetition)
        .eq('season_id', selectedSeason)
        .order('match_date', { ascending: true });
    },
    {
      enabled: !!selectedCompetition && !!selectedSeason,
    }
  );

  const { data: playoffData } = usePlayoffBracket(selectedCompetition, selectedSeason);
  const playoffsActive = !!playoffData?.bracket;

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!selectedTeam) return matches;
    
    return matches.filter(match => 
      match.home_teams.id === selectedTeam ||
      match.away_teams.id === selectedTeam
    );
  }, [matches, selectedTeam]);

  const regularSeasonMatches = filteredMatches.filter(match => match.stage === 'regular_season') || [];
  const finalStageMatches = filteredMatches.filter(match => match.stage !== 'regular_season') || [];

  const upcomingMatches = regularSeasonMatches.filter(match => 
    match.status === 'scheduled' || match.status === 'ongoing'
  );

  const completedMatches = regularSeasonMatches.filter(match => 
    match.status === 'completed'
  );

  const getStatusBadge = (status: string) => {
    const statusKey = `matchStatus.${status}`;
    const statusText = t(statusKey, { defaultValue: status });
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">{statusText}</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-green-600">{statusText}</Badge>;
      case 'completed':
        return <Badge variant="secondary">{statusText}</Badge>;
      case 'postponed':
        return <Badge variant="destructive">{statusText}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{statusText}</Badge>;
      default:
        return <Badge variant="outline">{statusText}</Badge>;
    }
  };

  const MatchCard = ({ match }: { match: MatchWithTeams }) => (
    <div>
      <Link to={`/matches/${match.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatMatchDateLocal(match.match_date, 'dd MMM yyyy', it)}
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatMatchDateLocal(match.match_date, 'HH:mm')}
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
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('errors.loadingMatches')}</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      );
    }

    if (!selectedCompetition || !selectedSeason) {
      return (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">{t('pages.matches.selectCompetitionAndSeason')}</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className={cn("grid w-full", playoffsActive ? "grid-cols-3" : "grid-cols-2")}>
          <TabsTrigger value="upcoming">
            {t('pages.matches.upcoming')} ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('pages.matches.completed')} ({completedMatches.length})
          </TabsTrigger>
          {playoffsActive && (
            <TabsTrigger value="final-stage">
              {t('pages.matches.finalStage')} ({finalStageMatches.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-2">{selectedTeam ? t('pages.matches.noMatchesForFilter') : t('pages.matches.noUpcoming')}</p>
              <p className="text-muted-foreground mb-4">{t('pages.matches.noUpcomingSubtitle')}</p>
              {user && !selectedTeam && (
                <Link to="/admin/fixtures/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('pages.matches.addFirstMatch')}
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
              <p className="text-xl text-muted-foreground mb-2">{selectedTeam ? t('pages.matches.noMatchesForFilter') : t('pages.matches.noCompleted')}</p>
              <p className="text-muted-foreground">{t('pages.matches.noCompletedSubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </TabsContent>

        {playoffsActive && (
          <TabsContent value="final-stage" className="mt-6">
            {finalStageMatches.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-2">Nessuna partita della fase finale</p>
                <p className="text-muted-foreground">Le partite dei playoff appariranno qui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {finalStageMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">{t('pages.matches.title')}</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl">
        <Select onValueChange={setSelectedCompetition} value={selectedCompetition} disabled={competitionsLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona Competizione" />
          </SelectTrigger>
          <SelectContent>
            {competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedSeason} value={selectedSeason} disabled={seasonsLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona Stagione" />
          </SelectTrigger>
          <SelectContent>
            {seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSelectedTeam(value === 'all' ? undefined : value)} value={selectedTeam || 'all'} disabled={teamsLoading}>
          <SelectTrigger>
            <SelectValue placeholder={t('pages.matches.selectTeam')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.matches.allTeams')}</SelectItem>
            {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {renderContent()}
    </div>
  );
};

export default Matches;
