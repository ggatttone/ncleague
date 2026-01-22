/**
 * BracketView Component
 *
 * Displays a knockout tournament bracket with support for
 * 4, 8, 16, and 32 team brackets.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchWithTeams } from '@/hooks/use-matches';

interface BracketViewProps {
  matches: MatchWithTeams[];
  showThirdPlace?: boolean;
  className?: string;
}

interface BracketMatch {
  match?: MatchWithTeams;
  homeTeam?: string;
  awayTeam?: string;
  winner?: string;
  stage: string;
  position: number;
}

interface BracketRound {
  name: string;
  nameKey: string;
  matches: BracketMatch[];
}

/**
 * Get knockout stage order (for sorting)
 */
function getStageOrder(stage: string): number {
  switch (stage) {
    case 'round-of-32':
      return 1;
    case 'round-of-16':
      return 2;
    case 'quarter-final':
      return 3;
    case 'semi-final':
      return 4;
    case 'third-place_playoff':
      return 5;
    case 'final':
      return 6;
    default:
      return 0;
  }
}

/**
 * Get stage display name
 */
function getStageNameKey(stage: string): string {
  switch (stage) {
    case 'round-of-32':
      return 'tournament.phases.roundOf32';
    case 'round-of-16':
      return 'tournament.phases.roundOf16';
    case 'quarter-final':
      return 'tournament.phases.quarterFinal';
    case 'semi-final':
      return 'tournament.phases.semiFinal';
    case 'third-place_playoff':
      return 'tournament.phases.thirdPlace';
    case 'final':
      return 'tournament.phases.final';
    default:
      return 'tournament.phases.unknown';
  }
}

/**
 * Single match card in the bracket
 */
function BracketMatchCard({
  match,
  isThirdPlace = false,
  isFinal = false,
}: {
  match?: BracketMatch;
  isThirdPlace?: boolean;
  isFinal?: boolean;
}) {
  const { t } = useTranslation();

  const homeTeam = match?.match?.home_teams;
  const awayTeam = match?.match?.away_teams;
  const homeScore = match?.match?.home_score;
  const awayScore = match?.match?.away_score;
  const isCompleted = match?.match?.status === 'completed';

  // Determine winner
  const homeWon = isCompleted && homeScore !== undefined && awayScore !== undefined && homeScore > awayScore;
  const awayWon = isCompleted && homeScore !== undefined && awayScore !== undefined && awayScore > homeScore;

  return (
    <Card
      className={cn(
        'w-48 transition-all',
        isFinal && 'border-yellow-500/50 bg-yellow-500/5',
        isThirdPlace && 'border-amber-600/50 bg-amber-600/5'
      )}
    >
      <CardContent className="p-3">
        {/* Match header */}
        {(isFinal || isThirdPlace) && (
          <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
            {isFinal ? (
              <>
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span>{t('tournament.phases.final')}</span>
              </>
            ) : (
              <>
                <Medal className="h-3 w-3 text-amber-600" />
                <span>{t('tournament.phases.thirdPlace')}</span>
              </>
            )}
          </div>
        )}

        {/* Teams */}
        <div className="space-y-1">
          {/* Home team */}
          <div
            className={cn(
              'flex items-center justify-between p-1.5 rounded text-sm',
              homeWon && 'bg-primary/10 font-semibold'
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {homeTeam?.logo_url && (
                <img
                  src={homeTeam.logo_url}
                  alt=""
                  className="h-4 w-4 object-contain flex-shrink-0"
                />
              )}
              <span className="truncate">{homeTeam?.name || t('tournament.bracket.tbd')}</span>
            </div>
            <span
              className={cn(
                'font-mono text-sm ml-2',
                homeWon && 'text-primary font-bold'
              )}
            >
              {homeScore ?? '-'}
            </span>
          </div>

          {/* Away team */}
          <div
            className={cn(
              'flex items-center justify-between p-1.5 rounded text-sm',
              awayWon && 'bg-primary/10 font-semibold'
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {awayTeam?.logo_url && (
                <img
                  src={awayTeam.logo_url}
                  alt=""
                  className="h-4 w-4 object-contain flex-shrink-0"
                />
              )}
              <span className="truncate">{awayTeam?.name || t('tournament.bracket.tbd')}</span>
            </div>
            <span
              className={cn(
                'font-mono text-sm ml-2',
                awayWon && 'text-primary font-bold'
              )}
            >
              {awayScore ?? '-'}
            </span>
          </div>
        </div>

        {/* Match status */}
        {match?.match && (
          <div className="mt-2 pt-2 border-t">
            <Badge
              variant={isCompleted ? 'default' : 'secondary'}
              className="text-xs"
            >
              {isCompleted
                ? t('tournament.bracket.completed')
                : t('tournament.bracket.upcoming')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Connector lines between rounds
 */
function BracketConnector({ matchCount }: { matchCount: number }) {
  if (matchCount <= 1) return null;

  return (
    <div className="flex flex-col justify-around h-full px-2">
      {Array.from({ length: matchCount / 2 }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="w-4 border-t border-border" />
          <div className="w-0 h-16 border-r border-border" />
          <div className="w-4 border-t border-border" />
        </div>
      ))}
    </div>
  );
}

export function BracketView({
  matches,
  showThirdPlace = true,
  className,
}: BracketViewProps) {
  const { t } = useTranslation();

  // Organize matches by round
  const rounds = useMemo((): BracketRound[] => {
    // Group matches by stage
    const stageGroups: Record<string, MatchWithTeams[]> = {};

    for (const match of matches) {
      const stage = match.stage || 'unknown';
      if (!stageGroups[stage]) {
        stageGroups[stage] = [];
      }
      stageGroups[stage].push(match);
    }

    // Convert to rounds array
    const roundsList: BracketRound[] = [];

    // Sort stages by order
    const sortedStages = Object.keys(stageGroups).sort(
      (a, b) => getStageOrder(a) - getStageOrder(b)
    );

    for (const stage of sortedStages) {
      // Skip third place if not showing
      if (stage === 'third-place_playoff' && !showThirdPlace) continue;

      const stageMatches = stageGroups[stage];
      const bracketMatches: BracketMatch[] = stageMatches.map((match, index) => ({
        match,
        homeTeam: match.home_teams?.name,
        awayTeam: match.away_teams?.name,
        winner:
          match.status === 'completed' && match.home_score !== null && match.away_score !== null
            ? match.home_score > match.away_score
              ? match.home_teams?.name
              : match.away_teams?.name
            : undefined,
        stage,
        position: index,
      }));

      roundsList.push({
        name: stage,
        nameKey: getStageNameKey(stage),
        matches: bracketMatches,
      });
    }

    return roundsList;
  }, [matches, showThirdPlace]);

  // Separate main bracket rounds from third place
  const mainRounds = rounds.filter((r) => r.name !== 'third-place_playoff');
  const thirdPlaceRound = rounds.find((r) => r.name === 'third-place_playoff');

  if (matches.length === 0) {
    return (
      <div className={cn('text-center py-10', className)}>
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('tournament.bracket.noBracket')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Main bracket */}
      <div className="overflow-x-auto">
        <div className="flex items-center justify-center gap-4 min-w-max py-4">
          {mainRounds.map((round, roundIndex) => (
            <div key={round.name} className="flex items-center">
              {/* Round column */}
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {t(round.nameKey)}
                </h3>
                <div
                  className="flex flex-col gap-4"
                  style={{
                    // Increase vertical spacing for earlier rounds
                    gap: `${Math.pow(2, mainRounds.length - roundIndex - 1) * 1}rem`,
                  }}
                >
                  {round.matches.map((match, matchIndex) => (
                    <BracketMatchCard
                      key={`${round.name}-${matchIndex}`}
                      match={match}
                      isFinal={round.name === 'final'}
                    />
                  ))}
                </div>
              </div>

              {/* Connector to next round */}
              {roundIndex < mainRounds.length - 1 && (
                <BracketConnector matchCount={round.matches.length} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Third place match (separate section) */}
      {thirdPlaceRound && thirdPlaceRound.matches.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex justify-center">
            <BracketMatchCard match={thirdPlaceRound.matches[0]} isThirdPlace />
          </div>
        </div>
      )}
    </div>
  );
}

export default BracketView;
