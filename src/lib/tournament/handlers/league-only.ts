/**
 * League Only Handler
 *
 * Implements tournament logic for a simple round-robin league format.
 * All teams play against each other (optionally twice with home/away).
 * Final standings determine the winner.
 */

import type {
  TournamentHandler,
  TournamentHandlerKey,
  PhaseConfig,
  ValidationResult,
  MatchGenerationContext,
  MatchGenerationResult,
  StandingsContext,
  PhaseTransitionContext,
  AdvancementRule,
} from '@/types/tournament-handlers';
import type { LeagueOnlySettings, TournamentModeSettings } from '@/types/tournament-settings';
import type { LeagueTableRow } from '@/types/database';
import { DEFAULT_LEAGUE_ONLY_SETTINGS } from '@/types/tournament-settings';
import { leagueOnlySettingsSchema } from '@/lib/tournament/schemas';
import { registerHandler, getHandlerPhases } from '@/lib/tournament/handler-registry';

/**
 * Type guard for LeagueOnlySettings
 */
function isLeagueOnlySettings(
  settings: TournamentModeSettings
): settings is LeagueOnlySettings {
  return (
    'pointsPerWin' in settings &&
    'pointsPerDraw' in settings &&
    'doubleRoundRobin' in settings
  );
}

/**
 * Generate round-robin pairings using the circle method
 * This ensures each team plays against every other team exactly once
 */
function generateRoundRobinPairings(
  teamIds: string[],
  includeReturnGames: boolean
): Array<{ home: string; away: string; round: number }> {
  const pairings: Array<{ home: string; away: string; round: number }> = [];
  const teams = [...teamIds];

  // If odd number of teams, add a "bye" placeholder
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
  }

  const n = teams.length;
  const rounds = n - 1;
  const halfSize = n / 2;

  // Circle method for round-robin scheduling
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];

      // Skip matches with "BYE" team
      if (home !== 'BYE' && away !== 'BYE') {
        pairings.push({
          home,
          away,
          round: round + 1,
        });
      }
    }

    // Rotate teams (keep first team fixed)
    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  // If double round-robin, add return games
  if (includeReturnGames) {
    const returnPairings = pairings.map((pairing) => ({
      home: pairing.away,
      away: pairing.home,
      round: pairing.round + rounds,
    }));
    pairings.push(...returnPairings);
  }

  return pairings;
}

/**
 * Calculate standings from match results
 */
function calculateLeagueStandings(
  context: StandingsContext
): LeagueTableRow[] {
  const { matches, settings, stageFilter } = context;

  // Filter matches by stage if specified
  const relevantMatches = stageFilter
    ? matches.filter((m) => m.stage === stageFilter)
    : matches;

  // Only count completed matches
  const completedMatches = relevantMatches.filter((m) => m.status === 'completed');

  // Build team stats map
  const teamStats: Record<
    string,
    {
      matches_played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
    }
  > = {};

  // Initialize all teams from matches
  for (const match of completedMatches) {
    if (!teamStats[match.home_team_id]) {
      teamStats[match.home_team_id] = {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
      };
    }
    if (!teamStats[match.away_team_id]) {
      teamStats[match.away_team_id] = {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
      };
    }
  }

  // Calculate stats from matches
  for (const match of completedMatches) {
    const homeStats = teamStats[match.home_team_id];
    const awayStats = teamStats[match.away_team_id];

    homeStats.matches_played++;
    awayStats.matches_played++;

    homeStats.goals_for += match.home_score;
    homeStats.goals_against += match.away_score;
    awayStats.goals_for += match.away_score;
    awayStats.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      homeStats.wins++;
      awayStats.losses++;
    } else if (match.home_score < match.away_score) {
      awayStats.wins++;
      homeStats.losses++;
    } else {
      homeStats.draws++;
      awayStats.draws++;
    }
  }

  // Convert to LeagueTableRow array
  const rows: LeagueTableRow[] = Object.entries(teamStats).map(
    ([teamId, stats]) => ({
      team_id: teamId,
      team_name: '', // Will be populated by caller
      matches_played: stats.matches_played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goals_for: stats.goals_for,
      goals_against: stats.goals_against,
      goal_difference: stats.goals_for - stats.goals_against,
      points:
        stats.wins * settings.pointsPerWin +
        stats.draws * settings.pointsPerDraw +
        stats.losses * settings.pointsPerLoss,
    })
  );

  // Sort by points, then by tie-breakers
  rows.sort((a, b) => {
    // Primary: points
    if (b.points !== a.points) return b.points - a.points;

    // Apply tie-breakers in order
    for (const tieBreaker of settings.tieBreakers) {
      switch (tieBreaker) {
        case 'goal_difference':
          if (b.goal_difference !== a.goal_difference) {
            return b.goal_difference - a.goal_difference;
          }
          break;
        case 'goals_scored':
          if (b.goals_for !== a.goals_for) {
            return b.goals_for - a.goals_for;
          }
          break;
        case 'goals_against':
          // Lower is better
          if (a.goals_against !== b.goals_against) {
            return a.goals_against - b.goals_against;
          }
          break;
        case 'wins':
          if (b.wins !== a.wins) {
            return b.wins - a.wins;
          }
          break;
        case 'head_to_head':
          // Head-to-head requires additional context - skip in basic calculation
          break;
        case 'fair_play':
          // Fair play requires card data - skip in basic calculation
          break;
      }
    }

    return 0;
  });

  return rows;
}

/**
 * League Only Handler Implementation
 */
export const LeagueOnlyHandler: TournamentHandler = {
  key: 'league_only' as TournamentHandlerKey,
  nameKey: 'tournament.modes.leagueOnly.name',
  descriptionKey: 'tournament.modes.leagueOnly.description',
  phases: getHandlerPhases('league_only'),
  defaultSettings: DEFAULT_LEAGUE_ONLY_SETTINGS,

  validateSettings(
    settings: TournamentModeSettings,
    teamCount?: number
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Validate with Zod schema
    const zodResult = leagueOnlySettingsSchema.safeParse(settings);
    if (!zodResult.success) {
      result.valid = false;
      for (const issue of zodResult.error.issues) {
        result.errors.push({
          field: issue.path.join('.'),
          messageKey: issue.message,
        });
      }
      return result;
    }

    // Team count validations
    if (teamCount !== undefined) {
      if (teamCount < 2) {
        result.valid = false;
        result.errors.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.minTeams',
          params: { min: 2 },
        });
      }

      // Warning for large leagues
      if (teamCount > 20) {
        result.warnings.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.manyTeamsWarning',
          params: { count: teamCount },
        });
      }

      // Calculate total matches
      if (isLeagueOnlySettings(settings)) {
        const matchesPerRound = (teamCount * (teamCount - 1)) / 2;
        const totalMatches = settings.doubleRoundRobin
          ? matchesPerRound * 2
          : matchesPerRound;

        if (totalMatches > 200) {
          result.warnings.push({
            field: 'matches',
            messageKey: 'tournament.validation.manyMatchesWarning',
            params: { count: totalMatches },
          });
        }
      }
    }

    return result;
  },

  generateMatches(context: MatchGenerationContext): MatchGenerationResult {
    const { teams, phase, settings } = context;

    if (!isLeagueOnlySettings(settings)) {
      return {
        success: false,
        matches: [],
        errors: ['Invalid settings for League Only mode'],
      };
    }

    if (teams.length < 2) {
      return {
        success: false,
        matches: [],
        errors: ['At least 2 teams are required'],
      };
    }

    // Generate round-robin pairings
    const teamIds = teams.map((t) => t.id);
    const includeReturnGames =
      phase.matchGeneration.includeReturnGames ?? settings.doubleRoundRobin;

    const pairings = generateRoundRobinPairings(teamIds, includeReturnGames);

    // Convert to match generation result format
    const matches = pairings.map((pairing) => ({
      home_team_id: pairing.home,
      away_team_id: pairing.away,
      stage: phase.id,
      round: pairing.round,
    }));

    return {
      success: true,
      matches,
    };
  },

  calculateStandings(context: StandingsContext): LeagueTableRow[] {
    return calculateLeagueStandings(context);
  },

  getNextPhase(context: PhaseTransitionContext): PhaseConfig | null {
    const { currentPhase, allPhases } = context;

    if (currentPhase.isTerminal) {
      return null;
    }

    // Find next phase by order
    const nextPhases = allPhases.filter((p) => p.order > currentPhase.order);
    if (nextPhases.length === 0) {
      return null;
    }

    return nextPhases.sort((a, b) => a.order - b.order)[0];
  },

  getAdvancingTeams(
    standings: LeagueTableRow[],
    rules: AdvancementRule[]
  ): string[] {
    const advancingTeams: string[] = [];

    for (const rule of rules) {
      const sorted =
        rule.from === 'top'
          ? [...standings].sort((a, b) => b.points - a.points)
          : [...standings].sort((a, b) => a.points - b.points);

      const selected = sorted.slice(0, rule.count).map((row) => row.team_id);
      advancingTeams.push(...selected);
    }

    // Remove duplicates
    return [...new Set(advancingTeams)];
  },
};

// Register handler when module is loaded
registerHandler(LeagueOnlyHandler);

export default LeagueOnlyHandler;
