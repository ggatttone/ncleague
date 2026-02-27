import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Player, Team, Goal, Match } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User, ArrowLeft, Calendar, Trophy, Target, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMatchDateLocal, computeAge } from '@/lib/utils';
import { FlagIcon } from '@/components/FlagIcon';
import { SEOHead } from '@/components/SEOHead';
import { ShareButton } from '@/components/ShareButton';
import { buildPersonJsonLd } from '@/lib/json-ld';

const PlayerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [photoOpen, setPhotoOpen] = useState(false);

  const { data: playerData, isLoading: playerLoading } = useSupabaseQuery<
    Player & { teams: Team | null }
  >(['player', id], async () =>
    supabase
      .from('players')
      .select(
        `
        *,
        teams:teams!players_team_id_fkey (
          id,
          name,
          logo_url
        )
      `,
      )
      .eq('id', id)
      .single(),
  );

  const { data: goals, isLoading: goalsLoading } = useSupabaseQuery<
    (Goal & { matches: Match & { home_teams: Team; away_teams: Team } })[]
  >(['player-goals', id], async () =>
    supabase
      .from('goals')
      .select(
        `
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
      `,
      )
      .eq('player_id', id)
      .order('created_at', { ascending: false }),
  );

  if (playerLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-9 w-40" />
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="w-40 h-52 sm:w-56 sm:h-72 rounded-xl" />
              <div className="flex-1 space-y-3 w-full">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
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

  const age = playerData.date_of_birth ? computeAge(playerData.date_of_birth) : null;

  const uniqueMatchesWithGoals = goals ? new Set(goals.map((g) => g.match_id)).size : 0;

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
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Player Photo */}
            {playerData.photo_url ? (
              <button
                onClick={() => setPhotoOpen(true)}
                className="relative w-40 h-52 sm:w-56 sm:h-72 rounded-xl overflow-hidden border-2 shadow-md group cursor-pointer flex-shrink-0"
                aria-label={t('pages.playerDetails.viewPhoto')}
              >
                <img
                  src={playerData.photo_url}
                  alt={`${playerData.first_name} ${playerData.last_name}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-40 h-52 sm:w-56 sm:h-72 rounded-xl overflow-hidden border-2 bg-primary/10 flex items-center justify-center flex-shrink-0">
                {playerData.jersey_number ? (
                  <span className="text-5xl sm:text-6xl font-bold text-primary/50">
                    {playerData.jersey_number}
                  </span>
                ) : (
                  <User className="h-16 w-16 sm:h-20 sm:w-20 text-primary/40" />
                )}
              </div>
            )}

            {/* Player Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <CardTitle className="text-2xl sm:text-3xl">
                {playerData.first_name} {playerData.last_name}
              </CardTitle>
              {/* Team - in risalto */}
              {playerData.teams && (
                <Link
                  to={`/teams/${playerData.teams.id}`}
                  className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-base font-medium justify-center sm:justify-start"
                >
                  {playerData.teams.logo_url ? (
                    <img
                      src={playerData.teams.logo_url}
                      alt={playerData.teams.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <Trophy className="h-5 w-5 text-primary" />
                  )}
                  <span>{playerData.teams.name}</span>
                </Link>
              )}

              {/* Info dettagli */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-muted-foreground">
                {playerData.date_of_birth && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatMatchDateLocal(
                        playerData.date_of_birth + 'T00:00:00+00:00',
                        'dd MMM yyyy',
                      )}
                      {age !== null && ` (${age} ${t('pages.playerDetails.yearsOld')})`}
                    </span>
                  </div>
                )}
                {playerData.nationality && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <FlagIcon nationality={playerData.nationality} size={20} />
                    <span>{playerData.nationality}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {playerData.role && <Badge variant="secondary">{playerData.role}</Badge>}
                {playerData.jersey_number && (
                  <Badge variant="outline">#{playerData.jersey_number}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bio Section */}
      {playerData.bio && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t('pages.playerDetails.bio')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {playerData.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pages.playerDetails.goalsScored')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{goals?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('pages.playerDetails.matchesScoredIn')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueMatchesWithGoals}</div>
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
                <Link key={goal.id} to={`/matches/${goal.matches.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {goal.matches.home_teams.name} vs {goal.matches.away_teams.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {goal.minute}' -{' '}
                        {formatMatchDateLocal(goal.matches.match_date, 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className="text-sm font-medium flex-shrink-0">
                      {goal.matches.home_score} - {goal.matches.away_score}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Lightbox */}
      {playerData.photo_url && (
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent className="p-0 bg-transparent border-0 max-w-4xl w-auto h-auto max-h-[90vh] flex items-center justify-center [&>button]:text-white [&>button]:hover:text-white/80">
            <img
              src={playerData.photo_url}
              alt={`${playerData.first_name} ${playerData.last_name}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PlayerDetails;
