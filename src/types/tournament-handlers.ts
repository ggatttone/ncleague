/**
 * Tournament Handler Types
 *
 * Defines the interface for tournament mode handlers.
 * Each handler implements the logic for a specific tournament format.
 */

import type { LeagueTableRow, Match, Team } from './database';
import type {
  TournamentModeSettings,
  PhaseConstraints,
  BaseStandingsSettings,
} from './tournament-settings';

/** Handler key identifiers for tournament modes */
export type TournamentHandlerKey =
  | 'league_only'
  | 'knockout'
  | 'groups_knockout'
  | 'swiss_system'
  | 'round_robin_final';

/** Match generation algorithm types */
export type MatchGenerationType =
  | 'round_robin'
  | 'knockout'
  | 'swiss_pairing'
  | 'group_assignment';

/** Advancement rule for phase transitions */
export interface AdvancementRule {
  /** Number of teams that advance */
  count: number;
  /** Source: 'top' = highest ranked, 'bottom' = lowest ranked */
  from: 'top' | 'bottom';
  /** Target phase ID */
  toPhase: string;
  /** Optional: group identifier for groups + knockout */
  fromGroup?: string;
}

/** Phase configuration within a tournament mode */
export interface PhaseConfig {
  /** Unique phase identifier (e.g., 'regular_season', 'quarter-final') */
  id: string;
  /** i18n key for phase name */
  nameKey: string;
  /** Order in the tournament flow (0-based) */
  order: number;
  /** Match generation configuration */
  matchGeneration: {
    type: MatchGenerationType;
    /** For round_robin: include return games? */
    includeReturnGames?: boolean;
    /** For knockout: bracket size override */
    bracketSize?: number;
  };
  /** Rules for advancing teams to next phase(s) */
  advancementRules?: AdvancementRule[];
  /** If true, this phase ends the tournament (e.g., final) */
  isTerminal: boolean;
  /** Optional scheduling constraints for this phase */
  constraints?: PhaseConstraints;
}

/** Result of settings validation */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    messageKey: string;
    params?: Record<string, unknown>;
  }>;
  warnings: Array<{
    field: string;
    messageKey: string;
    params?: Record<string, unknown>;
  }>;
}

/** Context for match generation */
export interface MatchGenerationContext {
  seasonId: string;
  competitionId: string;
  teams: Team[];
  phase: PhaseConfig;
  settings: TournamentModeSettings;
  /** Existing standings (for Swiss pairing, knockout seeding) */
  currentStandings?: LeagueTableRow[];
  /** Group assignments (for groups + knockout) */
  groupAssignments?: Record<string, string[]>; // groupId -> teamIds
}

/** Result of match generation */
export interface MatchGenerationResult {
  success: boolean;
  matches: Array<{
    home_team_id: string;
    away_team_id: string;
    stage: string;
    round?: number;
    group?: string;
  }>;
  errors?: string[];
}

/** Context for standings calculation */
export interface StandingsContext {
  matches: Match[];
  settings: BaseStandingsSettings;
  stageFilter?: string;
  groupFilter?: string;
}

/** Context for phase transition */
export interface PhaseTransitionContext {
  currentPhase: PhaseConfig;
  standings: LeagueTableRow[];
  allPhases: PhaseConfig[];
}

/**
 * Tournament Handler Interface
 *
 * Implements the logic for a specific tournament format.
 * Each handler manages its phases, match generation, and standings calculation.
 */
export interface TournamentHandler {
  /** Unique handler identifier */
  readonly key: TournamentHandlerKey;

  /** i18n key for handler name */
  readonly nameKey: string;

  /** i18n key for handler description */
  readonly descriptionKey: string;

  /** Phase configurations for this tournament mode */
  readonly phases: PhaseConfig[];

  /** Default settings for this mode */
  readonly defaultSettings: TournamentModeSettings;

  /**
   * Validate tournament settings
   * @param settings Settings to validate
   * @param teamCount Number of teams (for capacity validation)
   */
  validateSettings(
    settings: TournamentModeSettings,
    teamCount?: number
  ): ValidationResult;

  /**
   * Generate matches for a specific phase
   * @param context Match generation context
   */
  generateMatches(context: MatchGenerationContext): MatchGenerationResult;

  /**
   * Calculate standings for the given matches
   * @param context Standings context
   */
  calculateStandings(context: StandingsContext): LeagueTableRow[];

  /**
   * Determine the next phase after completing current phase
   * @param context Phase transition context
   * @returns Next phase config, or null if tournament is complete
   */
  getNextPhase(context: PhaseTransitionContext): PhaseConfig | null;

  /**
   * Get advancement teams for phase transition
   * @param standings Current standings
   * @param rules Advancement rules
   */
  getAdvancingTeams(
    standings: LeagueTableRow[],
    rules: AdvancementRule[]
  ): string[];
}

/** Handler metadata for UI display */
export interface TournamentHandlerMetadata {
  key: TournamentHandlerKey;
  nameKey: string;
  descriptionKey: string;
  icon: string; // Lucide icon name
  phases: PhaseConfig[];
  defaultSettings: TournamentModeSettings;
}

/**
 * Type guard to check if settings include standings configuration
 */
export function hasStandingsSettings(
  settings: TournamentModeSettings
): settings is TournamentModeSettings & BaseStandingsSettings {
  return (
    'pointsPerWin' in settings &&
    'pointsPerDraw' in settings &&
    'pointsPerLoss' in settings
  );
}

/**
 * Type guard for knockout settings
 */
export function isKnockoutSettings(
  settings: TournamentModeSettings
): settings is import('./tournament-settings').KnockoutSettings {
  return 'bracketSize' in settings && 'seedingMethod' in settings;
}
