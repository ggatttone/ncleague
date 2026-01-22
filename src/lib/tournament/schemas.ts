/**
 * Tournament Settings Zod Schemas
 *
 * Validation schemas for tournament mode settings.
 * Used for form validation and API request validation.
 */

import { z } from 'zod';

/** Tie-breaker criteria schema */
export const tieBreakerCriteriaSchema = z.enum([
  'head_to_head',
  'goal_difference',
  'goals_scored',
  'goals_against',
  'wins',
  'fair_play',
]);

/** Base standings settings schema */
export const baseStandingsSettingsSchema = z.object({
  pointsPerWin: z.number().int().min(0).max(10).default(3),
  pointsPerDraw: z.number().int().min(0).max(10).default(1),
  pointsPerLoss: z.number().int().min(0).max(10).default(0),
  tieBreakers: z
    .array(tieBreakerCriteriaSchema)
    .min(1, 'tournament.validation.atLeastOneTieBreaker')
    .default(['head_to_head', 'goal_difference', 'goals_scored']),
});

/** League Only settings schema */
export const leagueOnlySettingsSchema = baseStandingsSettingsSchema.extend({
  doubleRoundRobin: z.boolean().default(true),
});

/** Seeding method schema */
export const seedingMethodSchema = z.enum(['random', 'seeded', 'manual']);

/** Bracket size schema */
export const bracketSizeSchema = z.union([
  z.literal(4),
  z.literal(8),
  z.literal(16),
  z.literal(32),
]);

/** Knockout settings schema */
export const knockoutSettingsSchema = z.object({
  bracketSize: bracketSizeSchema.default(8),
  seedingMethod: seedingMethodSchema.default('seeded'),
  thirdPlaceMatch: z.boolean().default(true),
  doubleElimination: z.boolean().default(false),
});

/** Groups + Knockout settings schema */
export const groupsKnockoutSettingsSchema = baseStandingsSettingsSchema.extend({
  groupCount: z.number().int().min(2).max(8).default(4),
  teamsPerGroup: z.number().int().min(2).max(8).default(4),
  advancingPerGroup: z.number().int().min(1).max(4).default(2),
  doubleRoundRobin: z.boolean().default(false),
  knockoutSettings: knockoutSettingsSchema,
});

/** Playoff format schema */
export const playoffFormatSchema = z.enum([
  'single_match',
  'home_away',
  'best_of_3',
]);

/** Round Robin + Final settings schema */
export const roundRobinFinalSettingsSchema = baseStandingsSettingsSchema.extend(
  {
    doubleRoundRobin: z.boolean().default(true),
    playoffTeams: z.union([z.literal(2), z.literal(4), z.literal(8)]).default(4),
    playoffFormat: playoffFormatSchema.default('single_match'),
    thirdPlaceMatch: z.boolean().default(true),
  }
);

/** Snake seeding pattern schema */
export const snakeSeedingPatternSchema = z
  .array(z.array(z.number().int().min(1)))
  .min(2, 'tournament.validation.minTwoPoules')
  .refine(
    (pattern) => {
      // All sub-arrays should have same length
      if (pattern.length === 0) return true;
      const len = pattern[0].length;
      return pattern.every((arr) => arr.length === len);
    },
    { message: 'tournament.validation.equalPouleSize' }
  );

/** Poule format schema */
export const pouleFormatSchema = z.enum(['round_robin', 'swiss']);

/** Swiss System settings schema */
export const swissSystemSettingsSchema = baseStandingsSettingsSchema.extend({
  phase1Rounds: z.number().int().min(1).max(15).default(7),
  snakeSeedingPattern: snakeSeedingPatternSchema.default([
    [1, 4, 5, 8],
    [2, 3, 6, 7],
  ]),
  pouleFormat: pouleFormatSchema.default('round_robin'),
  doubleRoundRobin: z.boolean().default(true),
  finalStageTeams: z.number().int().min(2).max(8).default(4),
});

/** Phase constraints schema */
export const phaseConstraintsSchema = z.object({
  defaultDays: z.array(z.number().int().min(0).max(6)).optional(),
  defaultTimeSlots: z
    .array(z.string().regex(/^\d{2}:\d{2}$/))
    .optional(),
  matchesPerDay: z.number().int().min(1).optional(),
  restDaysBetweenMatches: z.number().int().min(0).optional(),
  homeAwayBalance: z.boolean().optional(),
});

/** Advancement rule schema */
export const advancementRuleSchema = z.object({
  count: z.number().int().min(1),
  from: z.enum(['top', 'bottom']),
  toPhase: z.string().min(1),
  fromGroup: z.string().optional(),
});

/** Match generation type schema */
export const matchGenerationTypeSchema = z.enum([
  'round_robin',
  'knockout',
  'swiss_pairing',
  'group_assignment',
]);

/** Phase config schema */
export const phaseConfigSchema = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  order: z.number().int().min(0),
  matchGeneration: z.object({
    type: matchGenerationTypeSchema,
    includeReturnGames: z.boolean().optional(),
    bracketSize: bracketSizeSchema.optional(),
  }),
  advancementRules: z.array(advancementRuleSchema).optional(),
  isTerminal: z.boolean(),
  constraints: phaseConstraintsSchema.optional(),
});

/** Handler key schema */
export const tournamentHandlerKeySchema = z.enum([
  'league_only',
  'knockout',
  'groups_knockout',
  'swiss_system',
  'round_robin_final',
]);

/**
 * Get the appropriate schema for a handler key
 */
export function getSettingsSchemaForHandler(handlerKey: string) {
  switch (handlerKey) {
    case 'league_only':
      return leagueOnlySettingsSchema;
    case 'knockout':
      return knockoutSettingsSchema;
    case 'groups_knockout':
      return groupsKnockoutSettingsSchema;
    case 'round_robin_final':
      return roundRobinFinalSettingsSchema;
    case 'swiss_system':
      return swissSystemSettingsSchema;
    default:
      // Fallback to league only for backwards compatibility
      return leagueOnlySettingsSchema;
  }
}

/**
 * Validate settings for a specific handler
 */
export function validateSettingsForHandler(
  handlerKey: string,
  settings: unknown
) {
  const schema = getSettingsSchemaForHandler(handlerKey);
  return schema.safeParse(settings);
}

/** Inferred types from schemas */
export type LeagueOnlySettingsInput = z.input<typeof leagueOnlySettingsSchema>;
export type KnockoutSettingsInput = z.input<typeof knockoutSettingsSchema>;
export type GroupsKnockoutSettingsInput = z.input<
  typeof groupsKnockoutSettingsSchema
>;
export type RoundRobinFinalSettingsInput = z.input<
  typeof roundRobinFinalSettingsSchema
>;
export type SwissSystemSettingsInput = z.input<
  typeof swissSystemSettingsSchema
>;
export type PhaseConfigInput = z.input<typeof phaseConfigSchema>;
