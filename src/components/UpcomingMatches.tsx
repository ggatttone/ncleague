import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase/client";
import { Match, Team } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type MatchWithTeams = Match & {
  home_teams: Team;
  away_teams: Team;
};

const MatchCard = ({ match }: { match: MatchWithTeams }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(match.match_date), 'dd MMM, HH:mm', { locale: it })}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.home_teams.logo_url ? (
            <img src={match.home_teams.logo_url} alt={match.home_teams.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><Trophy className="h-3 w-3 text-muted-foreground" /></div>
          )}
          <span className="font-medium text-sm truncate">{match.home_teams.name}</span>
        </div>
        <div className="text-sm text-muted-foreground">vs</div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-medium text-sm truncate text-right">{match.away_teams.name}</span>
          {match.away_teams.logo_url ? (
            <img src={match.away_teams.logo_url} alt={match.away_teams.name} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><Trophy className="h-3 w-3 text-muted-foreground" /></div>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2 truncate text-center">
        {match.venues?.name || 'Campo da definire'}
      </div>
    </CardContent>
  </Card>
);

export const UpcomingMatches = () => {
  const { t } = useTranslation();
  const { data: matches, isLoading } = useSupabaseQuery<MatchWithTeams[]>(
    ['upcoming-matches'],
    async () => supabase
      .from('matches')
      .select(`
        *,
        venues(name),
        home_teams:teams!matches_home_team_id_fkey (name, logo_url),
        away_teams:teams!matches_away_team_id_fkey (name, logo_url)
      `)
      .eq('status', 'scheduled')
      .order('match_date', { ascending: true })
      .limit(3)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('components.upcomingMatches.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !matches || matches.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>{t('components.upcomingMatches.noMatches')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Button asChild variant="outline" size="sm">
            <Link to="/matches">{t('components.upcomingMatches.viewFull')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};