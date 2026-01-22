import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { usePlayoffBracket } from '@/hooks/use-playoffs';
import { useCompetitions } from '@/hooks/use-competitions';
import { useSeasons, useSeasonWithTournamentMode } from '@/hooks/use-seasons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BracketView } from '@/components/BracketView';
import { getHandlerMetadata } from '@/lib/tournament/handler-registry';
import type { TournamentHandlerKey } from '@/types/tournament-handlers';

const Playoffs = () => {
  const { competitionId: urlCompetitionId, seasonId: urlSeasonId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedCompetition, setSelectedCompetition] = useState<string | undefined>(urlCompetitionId);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(urlSeasonId);

  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: seasons, isLoading: seasonsLoading } = useSeasons();

  // Get season with tournament mode for displaying mode info
  const { data: seasonWithMode } = useSeasonWithTournamentMode(selectedSeason);

  // Get tournament mode metadata
  const tournamentModeInfo = useMemo(() => {
    if (!seasonWithMode?.tournament_modes?.handler_key) return null;
    const handlerKey = seasonWithMode.tournament_modes.handler_key as TournamentHandlerKey;
    const metadata = getHandlerMetadata(handlerKey);
    return metadata
      ? {
          name: t(metadata.nameKey),
          key: handlerKey,
        }
      : null;
  }, [seasonWithMode, t]);

  // Check if tournament mode has knockout phases
  const hasKnockoutPhase = useMemo(() => {
    const handlerKey = seasonWithMode?.tournament_modes?.handler_key;
    return (
      handlerKey === 'knockout' ||
      handlerKey === 'groups_knockout' ||
      handlerKey === 'round_robin_final' ||
      handlerKey === 'swiss_system'
    );
  }, [seasonWithMode]);

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

  const isLoading = competitionsLoading || seasonsLoading || bracketLoading;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">{t('pages.playoffs.title')}</h1>
          {tournamentModeInfo && (
            <Badge variant="outline" className="text-sm">
              {tournamentModeInfo.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg">
          <Select onValueChange={setSelectedCompetition} value={selectedCompetition} disabled={competitionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.selectCompetition')} />
            </SelectTrigger>
            <SelectContent>
              {competitions?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedSeason} value={selectedSeason} disabled={seasonsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.selectSeason')} />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : !playoffData?.matches || playoffData.matches.length === 0 ? (
          <div className="text-center py-20 bg-muted/50 rounded-lg">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('pages.playoffs.noBracket')}
            </p>
            {!hasKnockoutPhase && seasonWithMode?.tournament_modes && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('pages.playoffs.noKnockoutPhase', {
                  mode: tournamentModeInfo?.name || seasonWithMode.tournament_modes.name,
                })}
              </p>
            )}
          </div>
        ) : (
          <BracketView
            matches={playoffData.matches}
            showThirdPlace={true}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Playoffs;
