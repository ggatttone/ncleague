import { useParams, Link } from "react-router-dom";
import { useTeam } from "@/hooks/use-teams";
import { useSponsors } from "@/hooks/use-sponsors";
import { useHonors } from "@/hooks/use-honors";
import { useTeamMatches, MatchWithTeams } from "@/hooks/use-matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ArrowLeft, Loader2, Trophy, Calendar, Star, Clock, MapPin } from "lucide-react";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatMatchDateLocal } from "@/lib/utils";

const MatchCard = ({ match }: { match: MatchWithTeams }) => {
  const { t } = useTranslation();
  const getStatusBadge = (status: string) => {
    const statusKey = `matchStatus.${status}`;
    const statusText = t(statusKey, { defaultValue: status });
    switch (status) {
      case 'scheduled': return <Badge variant="outline">{statusText}</Badge>;
      case 'ongoing': return <Badge variant="default" className="bg-green-600">{statusText}</Badge>;
      case 'completed': return <Badge variant="secondary">{statusText}</Badge>;
      case 'postponed': return <Badge variant="destructive">{statusText}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{statusText}</Badge>;
      default: return <Badge variant="outline">{statusText}</Badge>;
    }
  };

  return (
    <Link to={`/matches/${match.id}`} className="block">
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
            <div className="text-lg text-muted-foreground text-center">vs</div>
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
  );
};

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: sponsors, isLoading: sponsorsLoading } = useSponsors(id);
  const { data: honors, isLoading: honorsLoading } = useHonors(id);
  const { data: matches, isLoading: matchesLoading } = useTeamMatches(id);

  const completedMatches = matches?.filter(match => match.status === 'completed') || [];
  const upcomingMatches = matches?.filter(match => match.status === 'scheduled' || match.status === 'ongoing') || [];

  const isLoading = teamLoading || sponsorsLoading || honorsLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('pages.teamDetails.teamNotFound')}</h1>
        <Link to="/teams"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{t('pages.teamDetails.backToTeams')}</Button></Link>
      </div>
    );
  }

  const stats = matches?.reduce((acc, match) => {
    const isHome = match.home_team_id === id;
    const teamScore = isHome ? match.home_score : match.away_score;
    const opponentScore = isHome ? match.away_score : match.home_score;

    if (match.status === 'completed') {
      acc.played++;
      acc.gf += teamScore;
      acc.ga += opponentScore;
      if (teamScore > opponentScore) acc.wins++;
      else if (teamScore < opponentScore) acc.losses++;
      else acc.draws++;
    }
    return acc;
  }, { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/teams"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />{t('pages.teamDetails.backToTeams')}</Button></Link>
      </div>

      {team.squad_photo_url && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
          <img src={team.squad_photo_url} alt={`Foto rosa ${team.name}`} className="w-full h-auto max-h-96 object-cover" />
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {team.logo_url ? (
              <img src={team.logo_url} alt={`${team.name} logo`} className="w-24 h-24 rounded-full object-cover border-2" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2"><Users className="text-primary h-12 w-12" /></div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-3xl mb-2">{team.name}</CardTitle>
              <p className="text-muted-foreground">{team.parish}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="completed">
            <TabsList>
              <TabsTrigger value="completed">{t('pages.teamDetails.completed')}</TabsTrigger>
              <TabsTrigger value="upcoming">{t('pages.teamDetails.upcoming')}</TabsTrigger>
              <TabsTrigger value="stats">{t('pages.teamDetails.stats')}</TabsTrigger>
            </TabsList>
            <TabsContent value="completed" className="mt-4">
              <Card>
                <CardHeader><CardTitle>{t('pages.teamDetails.latestMatches')}</CardTitle></CardHeader>
                <CardContent>
                  {completedMatches.length > 0 ? (
                    <div className="space-y-4">
                      {completedMatches.slice(0, 10).map(match => (
                        <Link to={`/matches/${match.id}`} key={match.id} className="block border rounded-lg p-4 hover:bg-muted/50">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatMatchDateLocal(match.match_date, 'dd MMM yyyy', it)}
                            </div>
                            <div className="text-lg font-bold">
                              {match.home_teams.name} {match.home_score}-{match.away_score} {match.away_teams.name}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">{t('pages.teamDetails.noCompletedMatches')}</p>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
              <Card>
                <CardHeader><CardTitle>{t('pages.teamDetails.upcomingMatches')}</CardTitle></CardHeader>
                <CardContent>
                  {upcomingMatches.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingMatches.slice(0, 10).map(match => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">{t('pages.teamDetails.noUpcomingMatches')}</p>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader><CardTitle>{t('pages.teamDetails.seasonalStats')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.played}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.played')}</div></div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.wins}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.wins')}</div></div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.draws}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.draws')}</div></div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.losses}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.losses')}</div></div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.gf}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.goalsFor')}</div></div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center"><div className="text-2xl font-bold">{stats?.ga}</div><div className="text-sm text-muted-foreground">{t('pages.teamDetails.goalsAgainst')}</div></div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-8">
          <Card>
            <CardHeader><CardTitle>{t('pages.teamDetails.hallOfFame')}</CardTitle></CardHeader>
            <CardContent>
              {honors && honors.length > 0 ? (
                <ul className="space-y-3">
                  {honors.map(honor => (
                    <li key={honor.id} className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-semibold">{honor.achievement} - {honor.competitions?.name}</p>
                        <p className="text-sm text-muted-foreground">{honor.seasons?.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">{t('pages.teamDetails.noTrophies')}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('pages.teamDetails.sponsors')}</CardTitle></CardHeader>
            <CardContent>
              {sponsors && sponsors.length > 0 ? (
                <div className="flex flex-wrap gap-4 items-center">
                  {sponsors.map(sponsor => (
                    <a href={sponsor.website_url || '#'} key={sponsor.id} target="_blank" rel="noopener noreferrer">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt={sponsor.name} className="h-12 max-w-xs object-contain" />
                      ) : (
                        <div className="flex items-center gap-2"><Star className="h-4 w-4" />{sponsor.name}</div>
                      )}
                    </a>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">{t('pages.teamDetails.noSponsors')}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
