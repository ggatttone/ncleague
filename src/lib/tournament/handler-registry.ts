/**
 * Tournament Handler Registry
 *
 * Factory pattern implementation for tournament mode handlers.
 * Provides centralized access to handler metadata and instances.
 */

import type {
  TournamentHandler,
  TournamentHandlerKey,
  TournamentHandlerMetadata,
  PhaseConfig,
} from '@/types/tournament-handlers';
import type { TournamentModeSettings } from '@/types/tournament-settings';
import {
  DEFAULT_LEAGUE_ONLY_SETTINGS,
  DEFAULT_KNOCKOUT_SETTINGS,
  DEFAULT_GROUPS_KNOCKOUT_SETTINGS,
  DEFAULT_ROUND_ROBIN_FINAL_SETTINGS,
  DEFAULT_SWISS_SYSTEM_SETTINGS,
} from '@/types/tournament-settings';

/**
 * Phase configurations for each tournament mode
 */
const LEAGUE_ONLY_PHASES: PhaseConfig[] = [
  {
    id: 'start',
    nameKey: 'tournament.phases.start',
    order: 0,
    matchGeneration: { type: 'round_robin', includeReturnGames: true },
    isTerminal: false,
  },
  {
    id: 'regular_season',
    nameKey: 'tournament.phases.regularSeason',
    order: 1,
    matchGeneration: { type: 'round_robin', includeReturnGames: true },
    isTerminal: true,
  },
];

const KNOCKOUT_PHASES: PhaseConfig[] = [
  {
    id: 'start',
    nameKey: 'tournament.phases.start',
    order: 0,
    matchGeneration: { type: 'knockout' },
    isTerminal: false,
  },
  {
    id: 'quarter-final',
    nameKey: 'tournament.phases.quarterFinal',
    order: 1,
    matchGeneration: { type: 'knockout' },
    advancementRules: [{ count: 4, from: 'top', toPhase: 'semi-final' }],
    isTerminal: false,
  },
  {
    id: 'semi-final',
    nameKey: 'tournament.phases.semiFinal',
    order: 2,
    matchGeneration: { type: 'knockout' },
    advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }],
    isTerminal: false,
  },
  {
    id: 'third-place_playoff',
    nameKey: 'tournament.phases.thirdPlace',
    order: 3,
    matchGeneration: { type: 'knockout' },
    isTerminal: true,
  },
  {
    id: 'final',
    nameKey: 'tournament.phases.final',
    order: 4,
    matchGeneration: { type: 'knockout' },
    isTerminal: true,
  },
];

const GROUPS_KNOCKOUT_PHASES: PhaseConfig[] = [
  {
    id: 'start',
    nameKey: 'tournament.phases.start',
    order: 0,
    matchGeneration: { type: 'group_assignment' },
    isTerminal: false,
  },
  {
    id: 'group_stage',
    nameKey: 'tournament.phases.groupStage',
    order: 1,
    matchGeneration: { type: 'round_robin' },
    advancementRules: [{ count: 2, from: 'top', toPhase: 'knockout' }],
    isTerminal: false,
  },
  {
    id: 'knockout',
    nameKey: 'tournament.phases.knockout',
    order: 2,
    matchGeneration: { type: 'knockout' },
    isTerminal: false,
  },
  {
    id: 'final',
    nameKey: 'tournament.phases.final',
    order: 3,
    matchGeneration: { type: 'knockout' },
    isTerminal: true,
  },
];

const SWISS_SYSTEM_PHASES: PhaseConfig[] = [
  {
    id: 'start',
    nameKey: 'tournament.phases.start',
    order: 0,
    matchGeneration: { type: 'swiss_pairing' },
    isTerminal: false,
  },
  {
    id: 'regular_season',
    nameKey: 'tournament.phases.phase1',
    order: 1,
    matchGeneration: { type: 'swiss_pairing' },
    advancementRules: [
      { count: 4, from: 'top', toPhase: 'poule_a' },
      { count: 4, from: 'bottom', toPhase: 'poule_b' },
    ],
    isTerminal: false,
  },
  {
    id: 'poule_a',
    nameKey: 'tournament.phases.pouleA',
    order: 2,
    matchGeneration: { type: 'round_robin' },
    advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }],
    isTerminal: false,
  },
  {
    id: 'poule_b',
    nameKey: 'tournament.phases.pouleB',
    order: 2,
    matchGeneration: { type: 'round_robin' },
    isTerminal: true,
  },
  {
    id: 'final',
    nameKey: 'tournament.phases.final',
    order: 3,
    matchGeneration: { type: 'knockout' },
    isTerminal: true,
  },
];

const ROUND_ROBIN_FINAL_PHASES: PhaseConfig[] = [
  {
    id: 'start',
    nameKey: 'tournament.phases.start',
    order: 0,
    matchGeneration: { type: 'round_robin' },
    isTerminal: false,
  },
  {
    id: 'regular_season',
    nameKey: 'tournament.phases.regularSeason',
    order: 1,
    matchGeneration: { type: 'round_robin', includeReturnGames: true },
    advancementRules: [{ count: 4, from: 'top', toPhase: 'semi-final' }],
    isTerminal: false,
  },
  {
    id: 'semi-final',
    nameKey: 'tournament.phases.semiFinal',
    order: 2,
    matchGeneration: { type: 'knockout' },
    advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }],
    isTerminal: false,
  },
  {
    id: 'final',
    nameKey: 'tournament.phases.final',
    order: 3,
    matchGeneration: { type: 'knockout' },
    isTerminal: true,
  },
];

/**
 * Handler metadata registry
 */
const HANDLER_METADATA: Record<TournamentHandlerKey, TournamentHandlerMetadata> = {
  league_only: {
    key: 'league_only',
    nameKey: 'tournament.modes.leagueOnly.name',
    descriptionKey: 'tournament.modes.leagueOnly.description',
    icon: 'Trophy',
    phases: LEAGUE_ONLY_PHASES,
    defaultSettings: DEFAULT_LEAGUE_ONLY_SETTINGS,
  },
  knockout: {
    key: 'knockout',
    nameKey: 'tournament.modes.knockout.name',
    descriptionKey: 'tournament.modes.knockout.description',
    icon: 'Swords',
    phases: KNOCKOUT_PHASES,
    defaultSettings: DEFAULT_KNOCKOUT_SETTINGS,
  },
  groups_knockout: {
    key: 'groups_knockout',
    nameKey: 'tournament.modes.groupsKnockout.name',
    descriptionKey: 'tournament.modes.groupsKnockout.description',
    icon: 'Users',
    phases: GROUPS_KNOCKOUT_PHASES,
    defaultSettings: DEFAULT_GROUPS_KNOCKOUT_SETTINGS,
  },
  swiss_system: {
    key: 'swiss_system',
    nameKey: 'tournament.modes.swissSystem.name',
    descriptionKey: 'tournament.modes.swissSystem.description',
    icon: 'Shuffle',
    phases: SWISS_SYSTEM_PHASES,
    defaultSettings: DEFAULT_SWISS_SYSTEM_SETTINGS,
  },
  round_robin_final: {
    key: 'round_robin_final',
    nameKey: 'tournament.modes.roundRobinFinal.name',
    descriptionKey: 'tournament.modes.roundRobinFinal.description',
    icon: 'Award',
    phases: ROUND_ROBIN_FINAL_PHASES,
    defaultSettings: DEFAULT_ROUND_ROBIN_FINAL_SETTINGS,
  },
};

/**
 * Get all available handler metadata
 */
export function getAllHandlerMetadata(): TournamentHandlerMetadata[] {
  return Object.values(HANDLER_METADATA);
}

/**
 * Get metadata for a specific handler
 */
export function getHandlerMetadata(
  key: TournamentHandlerKey
): TournamentHandlerMetadata | undefined {
  return HANDLER_METADATA[key];
}

/**
 * Get default settings for a handler
 */
export function getDefaultSettings(
  key: TournamentHandlerKey
): TournamentModeSettings {
  return HANDLER_METADATA[key]?.defaultSettings ?? DEFAULT_LEAGUE_ONLY_SETTINGS;
}

/**
 * Get phases for a handler
 */
export function getHandlerPhases(key: TournamentHandlerKey): PhaseConfig[] {
  return HANDLER_METADATA[key]?.phases ?? LEAGUE_ONLY_PHASES;
}

/**
 * Check if a handler key is valid
 */
export function isValidHandlerKey(key: string): key is TournamentHandlerKey {
  return key in HANDLER_METADATA;
}

/**
 * Get handler key from legacy handler_key values
 * Provides backwards compatibility with existing data
 */
export function normalizeHandlerKey(key: string): TournamentHandlerKey {
  // Map legacy values to new handler keys
  const legacyMap: Record<string, TournamentHandlerKey> = {
    generate_playoffs: 'swiss_system', // Legacy NCL format
    default: 'league_only',
  };

  if (isValidHandlerKey(key)) {
    return key;
  }

  return legacyMap[key] ?? 'league_only';
}

/**
 * Get phase by ID from a handler's phases
 */
export function getPhaseById(
  handlerKey: TournamentHandlerKey,
  phaseId: string
): PhaseConfig | undefined {
  const phases = getHandlerPhases(handlerKey);
  return phases.find((p) => p.id === phaseId);
}

/**
 * Get the next phase after a given phase
 */
export function getNextPhase(
  handlerKey: TournamentHandlerKey,
  currentPhaseId: string
): PhaseConfig | null {
  const phases = getHandlerPhases(handlerKey);
  const currentPhase = phases.find((p) => p.id === currentPhaseId);

  if (!currentPhase || currentPhase.isTerminal) {
    return null;
  }

  // Find phases with higher order
  const nextPhases = phases.filter((p) => p.order > currentPhase.order);

  if (nextPhases.length === 0) {
    return null;
  }

  // Return the phase with the lowest order among candidates
  return nextPhases.sort((a, b) => a.order - b.order)[0];
}

/**
 * Get schedulable phases (non-terminal phases that need match generation)
 */
export function getSchedulablePhases(
  handlerKey: TournamentHandlerKey
): PhaseConfig[] {
  const phases = getHandlerPhases(handlerKey);
  // Include all phases except 'start'
  return phases.filter((p) => p.id !== 'start');
}

/**
 * Handler registry for lazy loading handler implementations
 * Handlers are loaded on demand to reduce bundle size
 */
const handlerInstances: Partial<Record<TournamentHandlerKey, TournamentHandler>> = {};

/**
 * Register a handler implementation
 * Called by handler modules when they're loaded
 */
export function registerHandler(handler: TournamentHandler): void {
  handlerInstances[handler.key] = handler;
}

/**
 * Get a handler instance
 * Returns undefined if handler is not yet loaded
 */
export function getHandler(
  key: TournamentHandlerKey
): TournamentHandler | undefined {
  return handlerInstances[key];
}

/**
 * Check if a handler is registered
 */
export function isHandlerRegistered(key: TournamentHandlerKey): boolean {
  return key in handlerInstances;
}
