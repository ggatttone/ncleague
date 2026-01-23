import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Swords,
  Users,
  Shuffle,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getHandlerMetadata,
  getHandlerPhases,
  isValidHandlerKey,
} from "@/lib/tournament/handler-registry";
import type { TournamentHandlerKey } from "@/types/tournament-handlers";
import type { TournamentModeSettings } from "@/types/tournament-settings";
import { cn } from "@/lib/utils";

interface TournamentModePreviewProps {
  handlerKey: string;
  settings?: TournamentModeSettings | null;
  teamCount?: number;
  className?: string;
}

const HANDLER_ICONS: Record<TournamentHandlerKey, React.ElementType> = {
  league_only: Trophy,
  knockout: Swords,
  groups_knockout: Users,
  swiss_system: Shuffle,
  round_robin_final: Award,
};

/**
 * Calculate estimated match count for a tournament configuration
 */
function calculateMatchCount(
  handlerKey: TournamentHandlerKey,
  teamCount: number,
  settings?: TournamentModeSettings | null
): { total: number; breakdown: { phase: string; count: number }[] } {
  const breakdown: { phase: string; count: number }[] = [];

  if (teamCount < 2) {
    return { total: 0, breakdown: [] };
  }

  const roundRobinMatches = (n: number, double: boolean) =>
    double ? n * (n - 1) : (n * (n - 1)) / 2;

  const knockoutMatches = (n: number, thirdPlace: boolean) => {
    // Number of matches = n - 1 (plus 1 for third place)
    return n - 1 + (thirdPlace ? 1 : 0);
  };

  switch (handlerKey) {
    case "league_only": {
      const double = (settings as any)?.doubleRoundRobin ?? true;
      const count = roundRobinMatches(teamCount, double);
      breakdown.push({ phase: "Regular Season", count });
      break;
    }

    case "knockout": {
      const thirdPlace = (settings as any)?.thirdPlaceMatch ?? false;
      const count = knockoutMatches(teamCount, thirdPlace);
      breakdown.push({ phase: "Knockout", count });
      break;
    }

    case "groups_knockout": {
      const groupCount = (settings as any)?.groupCount ?? 4;
      const teamsPerGroup = Math.ceil(teamCount / groupCount);
      const double = (settings as any)?.doubleRoundRobin ?? false;
      const advancingPerGroup = (settings as any)?.advancingPerGroup ?? 2;

      // Group stage matches
      const groupMatches = groupCount * roundRobinMatches(teamsPerGroup, double);
      breakdown.push({ phase: "Group Stage", count: groupMatches });

      // Knockout matches
      const knockoutTeams = groupCount * advancingPerGroup;
      const thirdPlace = (settings as any)?.knockoutSettings?.thirdPlaceMatch ?? false;
      const koMatches = knockoutMatches(knockoutTeams, thirdPlace);
      breakdown.push({ phase: "Knockout", count: koMatches });
      break;
    }

    case "swiss_system": {
      const phase1Rounds = (settings as any)?.phase1Rounds ?? 5;
      const matchesPerRound = Math.floor(teamCount / 2);

      // Phase 1 matches
      breakdown.push({ phase: "Phase 1", count: phase1Rounds * matchesPerRound });

      // Poule A and B (assuming half teams in each)
      const pouleSize = Math.floor(teamCount / 2);
      const pouleMatches = roundRobinMatches(pouleSize, false);
      breakdown.push({ phase: "Poule A", count: pouleMatches });
      breakdown.push({ phase: "Poule B", count: pouleMatches });

      // Final
      breakdown.push({ phase: "Final", count: 1 });
      break;
    }

    case "round_robin_final": {
      const double = (settings as any)?.doubleRoundRobin ?? true;
      const playoffTeams = (settings as any)?.playoffTeams ?? 4;
      const thirdPlace = (settings as any)?.thirdPlaceMatch ?? false;

      // Regular season
      const regularMatches = roundRobinMatches(teamCount, double);
      breakdown.push({ phase: "Regular Season", count: regularMatches });

      // Playoffs
      const playoffMatches = knockoutMatches(playoffTeams, thirdPlace);
      breakdown.push({ phase: "Playoffs", count: playoffMatches });
      break;
    }
  }

  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  return { total, breakdown };
}

/**
 * Validate tournament configuration
 */
function validateConfiguration(
  handlerKey: TournamentHandlerKey,
  teamCount: number,
  settings?: TournamentModeSettings | null
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (teamCount < 2) {
    errors.push("Need at least 2 teams");
    return { warnings, errors };
  }

  switch (handlerKey) {
    case "knockout": {
      const validSizes = [2, 4, 8, 16, 32];
      if (!validSizes.includes(teamCount)) {
        warnings.push(`Knockout works best with ${validSizes.join(", ")} teams. ${teamCount} teams may require byes.`);
      }
      break;
    }

    case "groups_knockout": {
      const groupCount = (settings as any)?.groupCount ?? 4;
      const teamsPerGroup = Math.ceil(teamCount / groupCount);
      if (teamCount < groupCount * 2) {
        errors.push(`Need at least ${groupCount * 2} teams for ${groupCount} groups`);
      }
      if (teamsPerGroup < 2) {
        errors.push("Each group needs at least 2 teams");
      }
      break;
    }

    case "swiss_system": {
      if (teamCount % 2 !== 0) {
        warnings.push("Swiss system works best with even number of teams");
      }
      if (teamCount < 6) {
        warnings.push("Swiss system is designed for 6+ teams");
      }
      break;
    }

    case "round_robin_final": {
      const playoffTeams = (settings as any)?.playoffTeams ?? 4;
      if (teamCount < playoffTeams) {
        errors.push(`Need at least ${playoffTeams} teams for playoffs`);
      }
      break;
    }
  }

  if (teamCount > 20) {
    warnings.push("Large tournaments may have many matches. Consider group format.");
  }

  return { warnings, errors };
}

export const TournamentModePreview = ({
  handlerKey,
  settings,
  teamCount = 0,
  className,
}: TournamentModePreviewProps) => {
  const { t } = useTranslation();

  const normalizedKey = isValidHandlerKey(handlerKey)
    ? handlerKey
    : "league_only";

  const metadata = getHandlerMetadata(normalizedKey);
  const phases = getHandlerPhases(normalizedKey);
  const Icon = HANDLER_ICONS[normalizedKey] ?? Trophy;

  const { total, breakdown } = useMemo(
    () => calculateMatchCount(normalizedKey, teamCount, settings),
    [normalizedKey, teamCount, settings]
  );

  const { warnings, errors } = useMemo(
    () => validateConfiguration(normalizedKey, teamCount, settings),
    [normalizedKey, teamCount, settings]
  );

  const playablePhases = phases.filter((p) => p.id !== "start");

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {t("components.tournamentModePreview.title", { defaultValue: "Tournament Preview" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode name */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("components.tournamentModePreview.mode", { defaultValue: "Mode" })}
          </span>
          <Badge variant="secondary">
            {metadata ? t(metadata.nameKey, { defaultValue: handlerKey }) : handlerKey}
          </Badge>
        </div>

        {/* Phase flow */}
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">
            {t("components.tournamentModePreview.phases", { defaultValue: "Phases" })}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {playablePhases.map((phase, idx) => (
              <div key={phase.id} className="flex items-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    phase.isTerminal && "bg-primary/10 border-primary"
                  )}
                >
                  {t(phase.nameKey, { defaultValue: phase.id })}
                </Badge>
                {idx < playablePhases.length - 1 && (
                  <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Match count */}
        {teamCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {t("components.tournamentModePreview.estimatedMatches", { defaultValue: "Estimated Matches" })}
              </span>
              <span className="font-bold text-lg">{total}</span>
            </div>
            {breakdown.length > 1 && (
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {breakdown.map((b) => (
                  <div key={b.phase} className="flex justify-between">
                    <span>{b.phase}</span>
                    <span className="font-medium">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team count */}
        {teamCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t("components.tournamentModePreview.teams", { defaultValue: "Teams" })}
            </span>
            <span className="font-medium">{teamCount}</span>
          </div>
        )}

        {/* Validation */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && errors.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {teamCount > 0 && errors.length === 0 && warnings.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            {t("components.tournamentModePreview.valid", { defaultValue: "Configuration is valid" })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentModePreview;
