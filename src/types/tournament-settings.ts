/**
 * Tournament Settings Types
 *
 * Defines typed settings interfaces for each tournament mode.
 * These are used for validation, form rendering, and match generation.
 */

/** Tie-breaker criteria for standings */
export type TieBreakerCriteria =
  | 'head_to_head'
  | 'goal_difference'
  | 'goals_scored'
  | 'goals_against'
  | 'wins'
  | 'fair_play';

/** Base settings shared by all tournament modes that include standings */
export interface BaseStandingsSettings {
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  tieBreakers: TieBreakerCriteria[];
}

/** Settings for League Only mode */
export interface LeagueOnlySettings extends BaseStandingsSettings {
  doubleRoundRobin: boolean;
}

/** Seeding method for knockout brackets */
export type SeedingMethod = 'random' | 'seeded' | 'manual';

/** Settings for Knockout mode */
export interface KnockoutSettings {
  bracketSize: 4 | 8 | 16 | 32;
  seedingMethod: SeedingMethod;
  thirdPlaceMatch: boolean;
  doubleElimination: boolean;
}

/** Settings for Groups + Knockout mode */
export interface GroupsKnockoutSettings extends BaseStandingsSettings {
  groupCount: number;
  teamsPerGroup: number;
  advancingPerGroup: number;
  doubleRoundRobin: boolean;
  knockoutSettings: KnockoutSettings;
}

/** Playoff format options */
export type PlayoffFormat = 'single_match' | 'home_away' | 'best_of_3';

/** Settings for Round Robin + Final mode */
export interface RoundRobinFinalSettings extends BaseStandingsSettings {
  doubleRoundRobin: boolean;
  playoffTeams: 2 | 4 | 8;
  playoffFormat: PlayoffFormat;
  thirdPlaceMatch: boolean;
}

/** Snake seeding pattern for Swiss System */
export type SnakeSeedingPattern = number[][];

/** Poule format for Swiss System phase 2 */
export type PouleFormat = 'round_robin' | 'swiss';

/** Settings for Swiss System mode */
export interface SwissSystemSettings extends BaseStandingsSettings {
  phase1Rounds: number;
  snakeSeedingPattern: SnakeSeedingPattern;
  pouleFormat: PouleFormat;
  doubleRoundRobin: boolean;
  finalStageTeams: number;
}

/** Phase constraints for scheduling */
export interface PhaseConstraints {
  defaultDays?: number[]; // 0-6, where 0 = Sunday
  defaultTimeSlots?: string[]; // "HH:mm" format
  matchesPerDay?: number;
  restDaysBetweenMatches?: number;
  homeAwayBalance?: boolean;
}

/** Union type of all tournament settings */
export type TournamentModeSettings =
  | LeagueOnlySettings
  | KnockoutSettings
  | GroupsKnockoutSettings
  | RoundRobinFinalSettings
  | SwissSystemSettings;

/** Default settings for each tournament mode */
export const DEFAULT_LEAGUE_ONLY_SETTINGS: LeagueOnlySettings = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tieBreakers: ['head_to_head', 'goal_difference', 'goals_scored'],
  doubleRoundRobin: true,
};

export const DEFAULT_KNOCKOUT_SETTINGS: KnockoutSettings = {
  bracketSize: 8,
  seedingMethod: 'seeded',
  thirdPlaceMatch: true,
  doubleElimination: false,
};

export const DEFAULT_GROUPS_KNOCKOUT_SETTINGS: GroupsKnockoutSettings = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tieBreakers: ['head_to_head', 'goal_difference', 'goals_scored'],
  groupCount: 4,
  teamsPerGroup: 4,
  advancingPerGroup: 2,
  doubleRoundRobin: false,
  knockoutSettings: DEFAULT_KNOCKOUT_SETTINGS,
};

export const DEFAULT_ROUND_ROBIN_FINAL_SETTINGS: RoundRobinFinalSettings = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tieBreakers: ['head_to_head', 'goal_difference', 'goals_scored'],
  doubleRoundRobin: true,
  playoffTeams: 4,
  playoffFormat: 'single_match',
  thirdPlaceMatch: true,
};

export const DEFAULT_SWISS_SYSTEM_SETTINGS: SwissSystemSettings = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tieBreakers: ['head_to_head', 'goal_difference', 'goals_scored'],
  phase1Rounds: 7,
  snakeSeedingPattern: [
    [1, 4, 5, 8],
    [2, 3, 6, 7],
  ],
  pouleFormat: 'round_robin',
  doubleRoundRobin: true,
  finalStageTeams: 4,
};
