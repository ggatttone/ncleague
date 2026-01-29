import { useMemo } from 'react';
import { format } from 'date-fns';
import { it, enUS, nl } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { parseAsLocalTime } from '@/lib/utils';

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
    <div className="space-y-4 overflow-auto max-h-[500px]">
      {groupedMatches.map((group) => (
        <div key={group.key} className="border rounded-lg overflow-hidden">
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
              {group.matches.length} {group.matches.length === 1 ? t('common.match') : t('common.matches')}
            </span>
          </div>

          {/* Matches Table */}
          <div className="divide-y">
            {group.matches.map((match, index) => (
              <div
                key={`${match.match_date}-${match.home_team_id}-${match.away_team_id}`}
                className={`grid grid-cols-[70px_1fr_auto] gap-4 px-4 py-2.5 items-center ${
                  index % 2 === 1 ? 'bg-muted/20' : ''
                }`}
              >
                {/* Time */}
                <div className="font-mono text-sm font-medium">
                  {formatTime(match.match_date)}
                </div>

                {/* Teams */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">
                    {teamsMap.get(match.home_team_id) || '—'}
                  </span>
                  <span className="text-muted-foreground text-sm flex-shrink-0">vs</span>
                  <span className="font-medium truncate">
                    {teamsMap.get(match.away_team_id) || '—'}
                  </span>
                </div>

                {/* Venue & Referee */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="truncate max-w-[150px]">
                    {venuesMap.get(match.venue_id) || '—'}
                  </span>
                  {isEventMode && (
                    <span className="truncate max-w-[100px]">
                      {match.referee_team_id
                        ? teamsMap.get(match.referee_team_id)
                        : '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
