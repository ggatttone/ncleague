import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { usePlayoffBracket } from '@/hooks/use-playoffs';
import { useCompetitions } from '@/hooks/use-competitions';
import { useSeasons } from '@/hooks/use-seasons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy } from 'lucide-react';
import { MatchWithTeams } from '@/hooks/use-matches';
import { useTranslation } from 'react-i18next';

const MatchCard = ({ match, title }: { match?: MatchWithTeams; title: string }) => {
  const homeTeam = match?.home_teams;
  const awayTeam = match?.away_teams;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>{homeTeam?.name || 'TBD'}</span>
            <span className="font-bold">{match?.home_score ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{awayTeam?.name || 'TBD'}</span>
            <span className="font-bold">{match?.away_score ?? '-'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Playoffs = () => {
  const { competitionId: urlCompetitionId, seasonId: urlSeasonId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>(urlCompetitionId);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(urlSeasonId);

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();

  useEffect(() => {
    if (urlCompetitionId && urlSeasonId) {
      setSelectedCompetition(urlCompetitionId);
      setSelectedSeason(urlSeasonId);
    } else {
      if (!competitionsLoading && competitions?.length === 1 && !selectedCompetition) {
        setSelectedCompetition(competitions[0].id);
      }
      if (!seasonsLoading && seasons?.length > 0 && !selectedSeason) {
        setSelectedSeason(seasons[0].id);
      }
    }
  }, [competitions, seasons, competitionsLoading, seasonsLoading, urlCompetitionId, urlSeasonId, selectedCompetition, selectedSeason]);
  
  useEffect(() => {
    if (selectedCompetition && selectedSeason && (selectedCompetition !== urlCompetitionId || selectedSeason !== urlSeasonId)) {
      navigate(`/playoffs/${selectedCompetition}/${selectedSeason}`, { replace: true });
    }
  }, [selectedCompetition, selectedSeason, navigate, urlCompetitionId, urlSeasonId]);

  const { data: playoffData, isLoading: bracketLoading } = usePlayoffBracket(selectedCompetition, selectedSeason);

  const thirdPlaceMatch = playoffData?.matches.find(m => m.stage === 'third-place_playoff');
  const finalMatch = playoffData?.matches.find(m => m.stage === 'final');

  const isLoading = competitionsLoading || seasonsLoading || bracketLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Playoffs</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
          <Select onValueChange={setSelectedCompetition} value={selectedCompetition} disabled={competitionsLoading}>
            <SelectTrigger><SelectValue placeholder="Seleziona Competizione" /></SelectTrigger>
            <SelectContent>{competitions?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedSeason} value={selectedSeason} disabled={seasonsLoading}>
            <SelectTrigger><SelectValue placeholder="Seleziona Stagione" /></SelectTrigger>
            <SelectContent>{seasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin" /></div>
        ) : !playoffData?.bracket ? (
          <div className="text-center py-20 bg-muted/50 rounded-lg">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tabellone playoff non ancora generato per questa stagione.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-8 w-full max-w-xs mx-auto">
            <MatchCard match={finalMatch} title="Finale" />
            <MatchCard match={thirdPlaceMatch} title="Finale 3°/4° Posto" />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Playoffs;