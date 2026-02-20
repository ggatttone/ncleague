import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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

const getPairKey = (idA: string, idB: string): string =>
  [idA, idB].sort().join("|");

export function GenerationStats({ matches, teamsMap, generationStats }: GenerationStatsProps) {
  const { t } = useTranslation();
  const [repeatsOpen, setRepeatsOpen] = useState(false);

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
  const matchupCounts = new Map<string, { idA: string; idB: string; count: number }>();
  for (const m of matches) {
    const [idA, idB] = [m.home_team_id, m.away_team_id].sort();
    const key = getPairKey(idA, idB);
    const existing = matchupCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      matchupCounts.set(key, { idA, idB, count: 1 });
    }
  }
  const repeatedMatchups = [...matchupCounts.values()].filter((entry) => entry.count > 1);
  const repeats = repeatedMatchups.length;

  const playedValues = [...teamStats.values()].map(s => s.played);
  const minPlayed = playedValues.length > 0 ? Math.min(...playedValues) : 0;
  const maxPlayed = playedValues.length > 0 ? Math.max(...playedValues) : 0;
  const maxPlayedSafe = Math.max(maxPlayed, 1);
  const imbalanced = playedValues.length > 0 && maxPlayed - minPlayed > 2;

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

      {repeats > 0 && (
        <Collapsible open={repeatsOpen} onOpenChange={setRepeatsOpen} className="space-y-1">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
            >
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", repeatsOpen && "rotate-180")}
              />
              {t("pages.admin.scheduleGenerator.showRepeats", { count: repeats })}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 space-y-0.5 text-xs pl-4">
              {repeatedMatchups.map(({ idA, idB, count }) => (
                <li key={getPairKey(idA, idB)} className="text-amber-700 dark:text-amber-400">
                  {teamsMap.get(idA) ?? idA} - {teamsMap.get(idB) ?? idB}: x{count}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

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
                <TableCell className="text-xs text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(stats.played / maxPlayedSafe) * 100}%` }}
                      />
                    </div>
                    <span>{stats.played}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-center">{stats.refereed || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
