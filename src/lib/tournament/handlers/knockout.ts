/**
 * Knockout Handler
 *
 * Implements tournament logic for single/double elimination bracket format.
 * Teams are paired in a bracket, losers are eliminated, winners advance.
 * Supports seeding methods (random, seeded, manual) and optional 3rd place match.
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
import type { KnockoutSettings, TournamentModeSettings } from '@/types/tournament-settings';
import type { LeagueTableRow } from '@/types/database';
import { DEFAULT_KNOCKOUT_SETTINGS } from '@/types/tournament-settings';
import { knockoutSettingsSchema } from '@/lib/tournament/schemas';
import { registerHandler, getHandlerPhases } from '@/lib/tournament/handler-registry';

/**
 * Type guard for KnockoutSettings
 */
function isKnockoutSettings(
  settings: TournamentModeSettings
): settings is KnockoutSettings {
  return (
    'bracketSize' in settings &&
    'seedingMethod' in settings &&
    'thirdPlaceMatch' in settings
  );
}

/**
 * Get knockout stage name based on number of teams remaining
 */
function getKnockoutStage(teamsRemaining: number): string {
  switch (teamsRemaining) {
    case 2:
      return 'final';
    case 4:
      return 'semi-final';
    case 8:
      return 'quarter-final';
    case 16:
      return 'round-of-16';
    case 32:
      return 'round-of-32';
    default:
      return `round-of-${teamsRemaining}`;
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Arrange teams in standard bracket order
 * For 8 teams: [1,8], [4,5], [3,6], [2,7]
 * This ensures higher seeds meet lower seeds first
 */
function arrangeBracketSeeding(teams: { id: string; seed?: number }[]): { id: string; seed?: number }[] {
  const n = teams.length;

  // Sort by seed if available
  const sorted = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  // Standard bracket arrangement
  const arranged: { id: string; seed?: number }[] = new Array(n);
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
  if (size === 16) return [0, 15, 8, 7, 4, 11, 12, 3, 2, 13, 10, 5, 6, 9, 14, 1];
  if (size === 32) {
    return [
      0, 31, 16, 15, 8, 23, 24, 7, 4, 27, 20, 11, 12, 19, 28, 3,
      2, 29, 18, 13, 10, 21, 26, 5, 6, 25, 22, 9, 14, 17, 30, 1
    ];
  }
  // Fallback: sequential
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Generate bracket pairings for a knockout round
 */
function generateKnockoutPairings(
  teams: { id: string; seed?: number }[],
  settings: KnockoutSettings,
  phase: PhaseConfig
): Array<{ home: string; away: string; stage: string; bracketPosition: number }> {
  const pairings: Array<{ home: string; away: string; stage: string; bracketPosition: number }> = [];

  // Apply seeding method
  let orderedTeams: { id: string; seed?: number }[];

  switch (settings.seedingMethod) {
    case 'random':
      orderedTeams = shuffleArray(teams);
      break;
    case 'seeded':
      orderedTeams = arrangeBracketSeeding(teams);
      break;
    case 'manual':
      // Use teams in provided order
      orderedTeams = teams;
      break;
    default:
      orderedTeams = teams;
  }

  // Generate pairings
  const stage = phase.id;

  for (let i = 0; i < orderedTeams.length; i += 2) {
    if (i + 1 < orderedTeams.length) {
      pairings.push({
        home: orderedTeams[i].id,
        away: orderedTeams[i + 1].id,
        stage,
        bracketPosition: Math.floor(i / 2),
      });
    }
  }

  return pairings;
}

/**
 * Calculate standings from knockout match results
 * For knockout, standings show elimination order (winners advance)
 */
function calculateKnockoutStandings(
  context: StandingsContext
): LeagueTableRow[] {
  const { matches, stageFilter } = context;

  // Filter matches by stage if specified
  const relevantMatches = stageFilter
    ? matches.filter((m) => m.stage === stageFilter)
    : matches;

  // Only count completed matches
  const completedMatches = relevantMatches.filter((m) => m.status === 'completed');

  // Build team stats
  const teamStats: Record<
    string,
    {
      matches_played: number;
      wins: number;
      losses: number;
      goals_for: number;
      goals_against: number;
      eliminated: boolean;
      eliminationRound: string | null;
    }
  > = {};

  // Initialize all teams from matches
  for (const match of completedMatches) {
    for (const teamId of [match.home_team_id, match.away_team_id]) {
      if (!teamStats[teamId]) {
        teamStats[teamId] = {
          matches_played: 0,
          wins: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          eliminated: false,
          eliminationRound: null,
        };
      }
    }
  }

  // Calculate stats
  for (const match of completedMatches) {
    const homeStats = teamStats[match.home_team_id];
    const awayStats = teamStats[match.away_team_id];

    if (!homeStats || !awayStats) continue;

    homeStats.matches_played++;
    awayStats.matches_played++;

    homeStats.goals_for += match.home_score;
    homeStats.goals_against += match.away_score;
    awayStats.goals_for += match.away_score;
    awayStats.goals_against += match.home_score;

    // Determine winner (no draws in knockout - would need extra time/penalties)
    if (match.home_score > match.away_score) {
      homeStats.wins++;
      awayStats.losses++;
      awayStats.eliminated = true;
      awayStats.eliminationRound = match.stage;
    } else if (match.away_score > match.home_score) {
      awayStats.wins++;
      homeStats.losses++;
      homeStats.eliminated = true;
      homeStats.eliminationRound = match.stage;
    }
  }

  // Convert to LeagueTableRow array
  const rows: LeagueTableRow[] = Object.entries(teamStats).map(
    ([teamId, stats]) => ({
      team_id: teamId,
      team_name: '', // Will be populated by caller
      matches_played: stats.matches_played,
      wins: stats.wins,
      draws: 0, // No draws in knockout
      losses: stats.losses,
      goals_for: stats.goals_for,
      goals_against: stats.goals_against,
      goal_difference: stats.goals_for - stats.goals_against,
      // Points based on advancement: more wins = higher ranking
      points: stats.wins * 3 - stats.losses,
    })
  );

  // Sort by wins (advancement), then goal difference
  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.goal_difference - a.goal_difference;
  });

  return rows;
}

/**
 * Determine current knockout phase based on matches played
 */
function determineCurrentKnockoutPhase(
  matches: StandingsContext['matches'],
  phases: PhaseConfig[]
): PhaseConfig | null {
  // Get knockout phases in order
  const knockoutPhases = phases
    .filter(p => p.id !== 'start')
    .sort((a, b) => a.order - b.order);

  for (const phase of knockoutPhases) {
    const phaseMatches = matches.filter(m => m.stage === phase.id);
    const completedMatches = phaseMatches.filter(m => m.status === 'completed');

    // If this phase has matches and not all are completed, we're in this phase
    if (phaseMatches.length > 0 && completedMatches.length < phaseMatches.length) {
      return phase;
    }

    // If no matches in this phase yet, this is the current phase
    if (phaseMatches.length === 0) {
      return phase;
    }
  }

  // All phases complete
  return knockoutPhases[knockoutPhases.length - 1] ?? null;
}

/**
 * Knockout Handler Implementation
 */
export const KnockoutHandler: TournamentHandler = {
  key: 'knockout' as TournamentHandlerKey,
  nameKey: 'tournament.modes.knockout.name',
  descriptionKey: 'tournament.modes.knockout.description',
  phases: getHandlerPhases('knockout'),
  defaultSettings: DEFAULT_KNOCKOUT_SETTINGS,

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
    const zodResult = knockoutSettingsSchema.safeParse(settings);
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

    if (!isKnockoutSettings(settings)) {
      result.valid = false;
      result.errors.push({
        field: 'settings',
        messageKey: 'tournament.validation.invalidKnockoutSettings',
      });
      return result;
    }

    // Team count validations
    if (teamCount !== undefined) {
      const validSizes = [4, 8, 16, 32];

      if (!validSizes.includes(teamCount)) {
        result.warnings.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.knockoutPowerOfTwo',
          params: { count: teamCount, validSizes: validSizes.join(', ') },
        });
      }

      if (teamCount < 2) {
        result.valid = false;
        result.errors.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.minTeams',
          params: { min: 2 },
        });
      }

      // Check if team count exceeds bracket size
      if (teamCount > settings.bracketSize) {
        result.valid = false;
        result.errors.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.tooManyTeamsForBracket',
          params: { count: teamCount, bracketSize: settings.bracketSize },
        });
      }

      // Warning if team count is less than bracket size
      if (teamCount < settings.bracketSize) {
        result.warnings.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.fewerTeamsThanBracket',
          params: { count: teamCount, bracketSize: settings.bracketSize },
        });
      }
    }

    // Double elimination not yet implemented
    if (settings.doubleElimination) {
      result.warnings.push({
        field: 'doubleElimination',
        messageKey: 'tournament.validation.doubleEliminationNotImplemented',
      });
    }

    return result;
  },

  generateMatches(context: MatchGenerationContext): MatchGenerationResult {
    const { teams, phase, settings } = context;

    if (!isKnockoutSettings(settings)) {
      return {
        success: false,
        matches: [],
        errors: ['Invalid settings for Knockout mode'],
      };
    }

    if (teams.length < 2) {
      return {
        success: false,
        matches: [],
        errors: ['At least 2 teams are required'],
      };
    }

    // For knockout, we only generate matches for the first round initially
    // Subsequent rounds are generated after previous round completes
    const teamsWithSeeds = teams.map((t, index) => ({
      id: t.id,
      seed: t.seed ?? index + 1,
    }));

    const pairings = generateKnockoutPairings(teamsWithSeeds, settings, phase);

    // Convert to match generation result format
    const matches = pairings.map((pairing) => ({
      home_team_id: pairing.home,
      away_team_id: pairing.away,
      stage: pairing.stage,
      round: 1, // Round within this phase
      bracket_position: pairing.bracketPosition,
    }));

    return {
      success: true,
      matches,
    };
  },

  calculateStandings(context: StandingsContext): LeagueTableRow[] {
    return calculateKnockoutStandings(context);
  },

  getNextPhase(context: PhaseTransitionContext): PhaseConfig | null {
    const { currentPhase, allPhases, standings, settings } = context;

    if (currentPhase.isTerminal) {
      return null;
    }

    // For knockout, check if we need third place match
    if (
      currentPhase.id === 'semi-final' &&
      isKnockoutSettings(settings) &&
      settings.thirdPlaceMatch
    ) {
      // Check if third place match exists and not yet generated
      const thirdPlacePhase = allPhases.find(p => p.id === 'third-place_playoff');
      if (thirdPlacePhase) {
        // Return both third place and final (they can happen in parallel)
        // For simplicity, return third place first
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
    // For knockout, advancing teams are simply the winners
    // They are determined by match results, not standings
    const advancingTeams: string[] = [];

    for (const rule of rules) {
      // In knockout, 'top' means winners
      const count = rule.count;
      const winners = standings
        .filter(row => row.wins > row.losses)
        .slice(0, count)
        .map(row => row.team_id);

      advancingTeams.push(...winners);
    }

    return [...new Set(advancingTeams)];
  },
};

// Register handler when module is loaded
registerHandler(KnockoutHandler);

export default KnockoutHandler;
