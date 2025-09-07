import { useParams, Link } from "react-router-dom";
import { useTeam } from "@/hooks/use-teams";
import { useSponsors } from "@/hooks/use-sponsors";
import { useHonors } from "@/hooks/use-honors";
import { useTeamMatches, MatchWithTeams } from "@/hooks/use-matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ArrowLeft, Loader2, Trophy, Calendar, Star } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: sponsors, isLoading: sponsorsLoading } = useSponsors(id);
  const { data: honors, isLoading: honorsLoading } = useHonors(id);
  const { data: matches, isLoading: matchesLoading } = useTeamMatches(id);

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
          <Tabs defaultValue="results">
            <TabsList>
              <TabsTrigger value="results">{t('pages.teamDetails.results')}</TabsTrigger>
              <TabsTrigger value="stats">{t('pages.teamDetails.stats')}</TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="mt-4">
              <Card>
                <CardHeader><CardTitle>{t('pages.teamDetails.latestMatches')}</CardTitle></CardHeader>
                <CardContent>
                  {matches && matches.length > 0 ? (
                    <div className="space-y-4">
                      {matches.slice(0, 10).map(match => (
                        <Link to={`/matches/${match.id}`} key={match.id} className="block border rounded-lg p-4 hover:bg-muted/50">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(match.match_date), 'dd MMM yyyy', { locale: it })}
                            </div>
                            <div className="text-lg font-bold">
                              {match.home_teams.name} {match.home_score}-{match.away_score} {match.away_teams.name}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">Nessuna partita trovata.</p>}
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