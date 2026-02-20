import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it, enUS, nl } from 'date-fns/locale';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, parseAsLocalTime } from '@/lib/utils';

interface GeneratedMatch {
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string;
  match_day?: number;
  referee_team_id?: string;
}

interface MatchPreviewListProps {
  matches: GeneratedMatch[];
  teamsMap: Map<string, string>;
  venuesMap: Map<string, string>;
  isEventMode: boolean;
}

interface MatchGroup {
  key: string;
  matchDay: number | null;
  date: Date;
  matches: GeneratedMatch[];
}

const localeMap: Record<string, Locale> = {
  it: it,
  en: enUS,
  nl: nl,
};

const getPairKey = (idA: string, idB: string): string =>
  [idA, idB].sort().join('|');

export function MatchPreviewList({
  matches,
  teamsMap,
  venuesMap,
  isEventMode,
}: MatchPreviewListProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || it;

  // Group matches by date or match_day
  const groupedMatches = useMemo<MatchGroup[]>(() => {
    const groups = new Map<string, GeneratedMatch[]>();

    for (const match of matches) {
      // For event mode, group by match_day if available; otherwise by date
      const key =
        isEventMode && match.match_day != null
          ? `day_${match.match_day}`
          : match.match_date.split('T')[0]; // YYYY-MM-DD

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(match);
    }

    // Convert to array and sort
    const result: MatchGroup[] = [];
    for (const [key, groupMatches] of groups) {
      const firstMatch = groupMatches[0];
      const date = parseAsLocalTime(firstMatch.match_date);
      const matchDay = key.startsWith('day_') ? parseInt(key.replace('day_', '')) : null;

      // Sort matches within group by time
      groupMatches.sort((a, b) => {
        const timeA = a.match_date.split('T')[1] || '';
        const timeB = b.match_date.split('T')[1] || '';
        return timeA.localeCompare(timeB);
      });

      result.push({
        key,
        matchDay,
        date,
        matches: groupMatches,
      });
    }

    // Sort groups by date
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  }, [matches, isEventMode]);

  const repeatedPairs = useMemo(() => {
    const counts = new Map<string, number>();

    for (const match of matches) {
      const pairKey = getPairKey(match.home_team_id, match.away_team_id);
      counts.set(pairKey, (counts.get(pairKey) ?? 0) + 1);
    }

    return new Set(
      [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key)
    );
  }, [matches]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOpenGroups(new Set(groupedMatches.map((group) => group.key)));
  }, [groupedMatches]);

  const formatTime = (isoString: string): string => {
    const date = parseAsLocalTime(isoString);
    return format(date, 'HH:mm');
  };

  const formatDateHeader = (date: Date): string => {
    return format(date, 'EEEE d MMMM yyyy', { locale: currentLocale });
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 overflow-auto max-h-[500px]">
        {repeatedPairs.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              {t('pages.admin.scheduleGenerator.repeatsBanner', {
                count: repeatedPairs.size,
              })}
            </span>
          </div>
        )}

        {groupedMatches.map((group) => {
          const groupOpen = openGroups.has(group.key);

          return (
            <div key={group.key} className="border rounded-lg overflow-hidden">
              <Collapsible
                open={groupOpen}
                onOpenChange={(open) => {
                  setOpenGroups((previous) => {
                    const next = new Set(previous);
                    if (open) {
                      next.add(group.key);
                    } else {
                      next.delete(group.key);
                    }
                    return next;
                  });
                }}
              >
                {/* Date Header */}
                <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-3">
                  {group.matchDay != null && (
                    <Badge variant="secondary" className="font-semibold">
                      #{group.matchDay}
                    </Badge>
                  )}
                  <span className="font-medium capitalize">
                    {formatDateHeader(group.date)}
                  </span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    {group.matches.length}{' '}
                    {group.matches.length === 1
                      ? t('common.match')
                      : t('common.matches')}
                  </span>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          !groupOpen && '-rotate-90'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="grid grid-cols-[70px_1fr_auto] gap-4 px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide border-b bg-muted/30">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('pages.admin.scheduleGenerator.colTime')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t('pages.admin.scheduleGenerator.colTeams')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="h-3 w-3" />
                        {t('pages.admin.scheduleGenerator.colVenue')}
                      </span>
                      {isEventMode && (
                        <span className="flex items-center gap-1 truncate max-w-[100px]">
                          <ShieldCheck className="h-3 w-3" />
                          {t('pages.admin.scheduleGenerator.colReferee')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matches Table */}
                  <div className="divide-y">
                    {group.matches.map((match, index) => {
                      const isRepeat = repeatedPairs.has(
                        getPairKey(match.home_team_id, match.away_team_id)
                      );

                      return (
                        <div
                          key={`${match.match_date}-${match.home_team_id}-${match.away_team_id}-${index}`}
                          className={cn(
                            'grid grid-cols-[70px_1fr_auto] gap-4 px-4 py-2.5 items-center',
                            index % 2 === 1 && 'bg-muted/20',
                            isRepeat &&
                              'border-l-2 border-l-amber-400 bg-amber-50/40 dark:bg-amber-900/10 pl-3'
                          )}
                        >
                          {/* Time */}
                          <div className="font-mono text-sm font-medium">
                            {formatTime(match.match_date)}
                          </div>

                          {/* Teams */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold truncate">
                              {teamsMap.get(match.home_team_id) || '—'}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 flex-shrink-0 font-normal text-muted-foreground"
                            >
                              vs
                            </Badge>
                            <span className="truncate text-muted-foreground">
                              {teamsMap.get(match.away_team_id) || '—'}
                            </span>
                          </div>

                          {/* Venue & Referee */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              {venuesMap.get(match.venue_id) || '—'}
                            </span>
                            {isEventMode && (
                              <span className="flex items-center gap-1 truncate max-w-[100px]">
                                <ShieldCheck className="h-3 w-3 flex-shrink-0" />
                                {match.referee_team_id
                                  ? teamsMap.get(match.referee_team_id)
                                  : '—'}
                              </span>
                            )}
                            {isRepeat && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {t(
                                      'pages.admin.scheduleGenerator.matchRepeatWarning'
                                    )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
