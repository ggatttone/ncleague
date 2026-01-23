/**
 * Round Robin + Final Handler
 *
 * Implements tournament logic for a combined format:
 * 1. Regular season: Round-robin league phase
 * 2. Playoff: Top N teams advance to knockout playoffs
 *
 * This format combines the fairness of a league (everyone plays everyone)
 * with the excitement of a knockout playoff for the championship.
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
import type { RoundRobinFinalSettings, TournamentModeSettings } from '@/types/tournament-settings';
import type { LeagueTableRow } from '@/types/database';
import { DEFAULT_ROUND_ROBIN_FINAL_SETTINGS } from '@/types/tournament-settings';
import { roundRobinFinalSettingsSchema } from '@/lib/tournament/schemas';
import { registerHandler, getHandlerPhases } from '@/lib/tournament/handler-registry';

/**
 * Type guard for RoundRobinFinalSettings
 */
function isRoundRobinFinalSettings(
  settings: TournamentModeSettings
): settings is RoundRobinFinalSettings {
  return (
    'pointsPerWin' in settings &&
    'pointsPerDraw' in settings &&
    'doubleRoundRobin' in settings &&
    'playoffTeams' in settings &&
    'playoffFormat' in settings
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
 * Arrange teams in standard bracket order
 * For 8 teams: [1,8], [4,5], [3,6], [2,7]
 * This ensures higher seeds meet lower seeds first
 */
function arrangeBracketSeeding(teams: { id: string; seed: number }[]): { id: string; seed: number }[] {
  const n = teams.length;

  // Sort by seed
  const sorted = [...teams].sort((a, b) => a.seed - b.seed);

  // Standard bracket arrangement
  const arranged: { id: string; seed: number }[] = new Array(n);
  const positions = getBracketPositions(n);

  for (let i = 0; i < n; i++) {
    arranged[positions[i]] = sorted[i];
  }

  return arranged;
}

/**
 * Get bracket positions for seeded tournament
 * Ensures #1 seed meets #8/#16/#32 if both reach final
 */
function getBracketPositions(size: number): number[] {
  if (size === 2) return [0, 1];
  if (size === 4) return [0, 3, 2, 1];
  if (size === 8) return [0, 7, 4, 3, 2, 5, 6, 1];
  // Fallback: sequential
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Generate knockout pairings for playoff phase
 */
function generatePlayoffPairings(
  teams: { id: string; seed: number }[],
  settings: RoundRobinFinalSettings,
  stage: string
): Array<{ home: string; away: string; stage: string; bracketPosition: number; leg?: number }> {
  const pairings: Array<{ home: string; away: string; stage: string; bracketPosition: number; leg?: number }> = [];

  // Use seeded bracket arrangement based on league standings
  const orderedTeams = arrangeBracketSeeding(teams);

  // Generate pairings based on playoff format
  for (let i = 0; i < orderedTeams.length; i += 2) {
    if (i + 1 < orderedTeams.length) {
      const bracketPosition = Math.floor(i / 2);

      if (settings.playoffFormat === 'single_match') {
        // Single match - higher seed plays at home
        pairings.push({
          home: orderedTeams[i].id,
          away: orderedTeams[i + 1].id,
          stage,
          bracketPosition,
        });
      } else if (settings.playoffFormat === 'home_away') {
        // Home and away - two legs
        pairings.push({
          home: orderedTeams[i].id,
          away: orderedTeams[i + 1].id,
          stage,
          bracketPosition,
          leg: 1,
        });
        pairings.push({
          home: orderedTeams[i + 1].id,
          away: orderedTeams[i].id,
          stage,
          bracketPosition,
          leg: 2,
        });
      } else if (settings.playoffFormat === 'best_of_3') {
        // Best of 3 - first two games, third if needed
        pairings.push({
          home: orderedTeams[i].id,
          away: orderedTeams[i + 1].id,
          stage,
          bracketPosition,
          leg: 1,
        });
        pairings.push({
          home: orderedTeams[i + 1].id,
          away: orderedTeams[i].id,
          stage,
          bracketPosition,
          leg: 2,
        });
        // Note: Third game would be generated dynamically if needed
      }
    }
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
 * Get knockout stage name based on number of teams
 */
function getKnockoutStage(teamsRemaining: number): string {
  switch (teamsRemaining) {
    case 2:
      return 'final';
    case 4:
      return 'semi-final';
    case 8:
      return 'quarter-final';
    default:
      return `round-of-${teamsRemaining}`;
  }
}

/**
 * Round Robin + Final Handler Implementation
 */
export const RoundRobinFinalHandler: TournamentHandler = {
  key: 'round_robin_final' as TournamentHandlerKey,
  nameKey: 'tournament.modes.roundRobinFinal.name',
  descriptionKey: 'tournament.modes.roundRobinFinal.description',
  phases: getHandlerPhases('round_robin_final'),
  defaultSettings: DEFAULT_ROUND_ROBIN_FINAL_SETTINGS,

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
    const zodResult = roundRobinFinalSettingsSchema.safeParse(settings);
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

    if (!isRoundRobinFinalSettings(settings)) {
      result.valid = false;
      result.errors.push({
        field: 'settings',
        messageKey: 'tournament.validation.invalidRoundRobinFinalSettings',
      });
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

      // Check if enough teams for playoffs
      if (teamCount < settings.playoffTeams) {
        result.valid = false;
        result.errors.push({
          field: 'playoffTeams',
          messageKey: 'tournament.validation.notEnoughTeamsForPlayoffs',
          params: { required: settings.playoffTeams, available: teamCount },
        });
      }

      // Warning for very few teams in playoffs
      if (teamCount > 2 && settings.playoffTeams === teamCount) {
        result.warnings.push({
          field: 'playoffTeams',
          messageKey: 'tournament.validation.allTeamsInPlayoffsWarning',
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
      const leagueMatches = (teamCount * (teamCount - 1)) / 2;
      const totalLeagueMatches = settings.doubleRoundRobin
        ? leagueMatches * 2
        : leagueMatches;

      // Calculate playoff matches based on format
      let playoffMatchesPerPairing = 1;
      if (settings.playoffFormat === 'home_away') {
        playoffMatchesPerPairing = 2;
      } else if (settings.playoffFormat === 'best_of_3') {
        playoffMatchesPerPairing = 2; // Minimum, could be 3
      }

      const playoffRounds = Math.log2(settings.playoffTeams);
      const playoffMatches = (settings.playoffTeams - 1) * playoffMatchesPerPairing;
      const thirdPlaceMatches = settings.thirdPlaceMatch ? playoffMatchesPerPairing : 0;
      const totalMatches = totalLeagueMatches + playoffMatches + thirdPlaceMatches;

      if (totalMatches > 200) {
        result.warnings.push({
          field: 'matches',
          messageKey: 'tournament.validation.manyMatchesWarning',
          params: { count: totalMatches },
        });
      }
    }

    return result;
  },

  generateMatches(context: MatchGenerationContext): MatchGenerationResult {
    const { teams, phase, settings, existingMatches } = context;

    if (!isRoundRobinFinalSettings(settings)) {
      return {
        success: false,
        matches: [],
        errors: ['Invalid settings for Round Robin + Final mode'],
      };
    }

    if (teams.length < 2) {
      return {
        success: false,
        matches: [],
        errors: ['At least 2 teams are required'],
      };
    }

    // Regular season phase - use round-robin
    if (phase.id === 'regular_season') {
      const teamIds = teams.map((t) => t.id);
      const includeReturnGames =
        phase.matchGeneration.includeReturnGames ?? settings.doubleRoundRobin;

      const pairings = generateRoundRobinPairings(teamIds, includeReturnGames);

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
    }

    // Playoff phases - use knockout logic
    if (phase.id === 'semi-final' || phase.id === 'final' || phase.id === 'third-place_playoff') {
      // For playoffs, teams should be seeded based on league standings
      const teamsWithSeeds = teams.map((t, index) => ({
        id: t.id,
        seed: t.seed ?? index + 1,
      }));

      const pairings = generatePlayoffPairings(teamsWithSeeds, settings, phase.id);

      const matches = pairings.map((pairing) => ({
        home_team_id: pairing.home,
        away_team_id: pairing.away,
        stage: pairing.stage,
        round: pairing.leg ?? 1,
        bracket_position: pairing.bracketPosition,
      }));

      return {
        success: true,
        matches,
      };
    }

    return {
      success: false,
      matches: [],
      errors: [`Unknown phase: ${phase.id}`],
    };
  },

  calculateStandings(context: StandingsContext): LeagueTableRow[] {
    return calculateLeagueStandings(context);
  },

  getNextPhase(context: PhaseTransitionContext): PhaseConfig | null {
    const { currentPhase, allPhases, settings } = context;

    if (currentPhase.isTerminal) {
      return null;
    }

    // For semi-final, check if we need third place match
    if (
      currentPhase.id === 'semi-final' &&
      isRoundRobinFinalSettings(settings) &&
      settings.thirdPlaceMatch
    ) {
      const thirdPlacePhase = allPhases.find(p => p.id === 'third-place_playoff');
      if (thirdPlacePhase) {
        return thirdPlacePhase;
      }
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
registerHandler(RoundRobinFinalHandler);

export default RoundRobinFinalHandler;
