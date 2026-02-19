import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GenerationStatsProps {
  matches: Array<{
    home_team_id: string;
    away_team_id: string;
    referee_team_id?: string | null;
  }>;
  teamsMap: Map<string, string>;
  generationStats?: {
    attemptsRun: number;
    bestAttemptIndex: number;
    bestScore: number;
    quality: {
      repeatViolations: number;
      backToBackViolations: number;
      unfilledSlots: number;
      matchImbalanceStdDev: number;
    };
  } | null;
}

export function GenerationStats({ matches, teamsMap, generationStats }: GenerationStatsProps) {
  const { t } = useTranslation();
  // Count matches per team
  const teamStats = new Map<string, { played: number; refereed: number }>();

  for (const m of matches) {
    if (!teamStats.has(m.home_team_id)) teamStats.set(m.home_team_id, { played: 0, refereed: 0 });
    if (!teamStats.has(m.away_team_id)) teamStats.set(m.away_team_id, { played: 0, refereed: 0 });
    teamStats.get(m.home_team_id)!.played++;
    teamStats.get(m.away_team_id)!.played++;
    if (m.referee_team_id) {
      if (!teamStats.has(m.referee_team_id)) teamStats.set(m.referee_team_id, { played: 0, refereed: 0 });
      teamStats.get(m.referee_team_id)!.refereed++;
    }
  }

  // Count repeated matchups
  const matchupCounts = new Map<string, number>();
  for (const m of matches) {
    const key = [m.home_team_id, m.away_team_id].sort().join('-');
    matchupCounts.set(key, (matchupCounts.get(key) ?? 0) + 1);
  }
  const repeats = [...matchupCounts.values()].filter(c => c > 1).length;

  const playedValues = [...teamStats.values()].map(s => s.played);
  const minPlayed = Math.min(...playedValues);
  const maxPlayed = Math.max(...playedValues);
  const imbalanced = maxPlayed - minPlayed > 2;

  const entries = [...teamStats.entries()].sort((a, b) => b[1].played - a[1].played);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span>{t('pages.admin.scheduleGenerator.totalMatches')}: <strong>{matches.length}</strong></span>
        {repeats > 0 && (
          <span className="text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t('pages.admin.scheduleGenerator.repeats', { count: repeats })}
          </span>
        )}
        {imbalanced && (
          <span className="text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t('pages.admin.scheduleGenerator.imbalance', { min: minPlayed, max: maxPlayed })}
          </span>
        )}
        {generationStats && (
          <span className="text-muted-foreground">
            {t('pages.admin.scheduleGenerator.attemptsInfo', {
              best: generationStats.bestAttemptIndex + 1,
              total: generationStats.attemptsRun,
            })}
          </span>
        )}
      </div>

      <div className="overflow-auto max-h-48">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">{t('pages.admin.scheduleGenerator.statsTeam')}</TableHead>
              <TableHead className="text-xs text-center">{t('pages.admin.scheduleGenerator.statsMatches')}</TableHead>
              <TableHead className="text-xs text-center">{t('pages.admin.scheduleGenerator.statsRefereed')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([teamId, stats]) => (
              <TableRow key={teamId}>
                <TableCell className="text-xs">{teamsMap.get(teamId) ?? teamId}</TableCell>
                <TableCell className="text-xs text-center">{stats.played}</TableCell>
                <TableCell className="text-xs text-center">{stats.refereed || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
