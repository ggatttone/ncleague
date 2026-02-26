import { useParams, Link } from "react-router-dom";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Player, Team, Goal, Match } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, Calendar, Trophy, Target } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMatchDateLocal } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { ShareButton } from "@/components/ShareButton";
import { buildPersonJsonLd } from "@/lib/json-ld";

const PlayerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: playerData, isLoading: playerLoading } = useSupabaseQuery<Player & { teams: Team | null }>(
    ['player', id],
    async () => supabase
      .from('players')
      .select(`
        *,
        teams:teams!players_team_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .eq('id', id)
      .single()
  );

  const { data: goals, isLoading: goalsLoading } = useSupabaseQuery<(Goal & { matches: Match & { home_teams: Team, away_teams: Team } })[]>(
    ['player-goals', id],
    async () => supabase
      .from('goals')
      .select(`
        *,
        matches (
          id,
          match_date,
          home_score,
          away_score,
          home_teams:teams!matches_home_team_id_fkey (
            id,
            name
          ),
          away_teams:teams!matches_away_team_id_fkey (
            id,
            name
          )
        )
      `)
      .eq('player_id', id)
      .order('created_at', { ascending: false })
  );

  if (playerLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-9 w-40" />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">{t('pages.playerDetails.playerNotFound')}</h1>
          <Link to="/players">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('pages.playerDetails.backToPlayers')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const age = playerData.date_of_birth 
    ? new Date().getFullYear() - new Date(playerData.date_of_birth).getFullYear()
    : null;

  return (
    <div className="container mx-auto py-8 px-4">
      <SEOHead
        title={`${playerData.first_name} ${playerData.last_name}`}
        description={`${playerData.first_name} ${playerData.last_name}${playerData.teams?.name ? ` - ${playerData.teams.name}` : ''}${playerData.role ? ` | ${playerData.role}` : ''}`}
        image={playerData.photo_url || undefined}
        url={`/players/${id}`}
        jsonLd={buildPersonJsonLd({
          name: `${playerData.first_name} ${playerData.last_name}`,
          image: playerData.photo_url || undefined,
          teamName: playerData.teams?.name || undefined,
          url: `/players/${id}`,
        })}
      />
      <div className="mb-6 flex items-center justify-between">
        <Link to="/players">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('pages.playerDetails.backToPlayers')}
          </Button>
        </Link>
        <ShareButton
          path={`/players/${id}`}
          title={`${playerData.first_name} ${playerData.last_name}`}
          description={`${playerData.first_name} ${playerData.last_name}${playerData.teams?.name ? ` - ${playerData.teams.name}` : ''}`}
        />
      </div>

      {/* Player Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2">
              <AvatarImage src={playerData.photo_url || undefined} alt={`${playerData.first_name} ${playerData.last_name}`} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {playerData.jersey_number ? (
                  <span className="text-2xl sm:text-3xl font-bold">{playerData.jersey_number}</span>
                ) : (
                  <User className="h-10 w-10 sm:h-12 sm:w-12" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-2xl sm:text-3xl mb-2">
                {playerData.first_name} {playerData.last_name}
              </CardTitle>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-muted-foreground">
                {playerData.teams && (
                  <Link 
                    to={`/teams/${playerData.teams.id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors justify-center sm:justify-start"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>{playerData.teams.name}</span>
                  </Link>
                )}
                {age && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Calendar className="h-4 w-4" />
                    <span>{age} {t('pages.playerDetails.yearsOld')}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {playerData.role && (
                  <Badge variant="secondary">
                    {playerData.role}
                  </Badge>
                )}
                {playerData.jersey_number && (
                  <Badge variant="outline">
                    #{playerData.jersey_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pages.playerDetails.goalsScored')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pages.playerDetails.matchesPlayed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">{t('pages.playerDetails.dataUnavailable')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('pages.playerDetails.avgGoals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">{t('pages.playerDetails.dataUnavailable')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('pages.playerDetails.goalsHistory')} ({goals?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goalsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('pages.playerDetails.noGoals')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {goal.matches.home_teams.name} vs {goal.matches.away_teams.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {goal.minute}' - {formatMatchDateLocal(goal.matches.match_date, 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {goal.matches.home_score} - {goal.matches.away_score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerDetails;
