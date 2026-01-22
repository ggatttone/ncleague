/**
 * Groups + Knockout Handler
 *
 * Implements tournament logic for a two-phase format:
 * 1. Group stage: Teams are divided into groups and play round-robin
 * 2. Knockout stage: Top teams from each group advance to elimination bracket
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
import type { GroupsKnockoutSettings, TournamentModeSettings } from '@/types/tournament-settings';
import type { LeagueTableRow } from '@/types/database';
import { DEFAULT_GROUPS_KNOCKOUT_SETTINGS } from '@/types/tournament-settings';
import { groupsKnockoutSettingsSchema } from '@/lib/tournament/schemas';
import { registerHandler, getHandlerPhases } from '@/lib/tournament/handler-registry';

/**
 * Type guard for GroupsKnockoutSettings
 */
function isGroupsKnockoutSettings(
  settings: TournamentModeSettings
): settings is GroupsKnockoutSettings {
  return (
    'groupCount' in settings &&
    'teamsPerGroup' in settings &&
    'advancingPerGroup' in settings &&
    'knockoutSettings' in settings
  );
}

/**
 * Group names for display (A, B, C, D, E, F, G, H)
 */
const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Generate group ID from index
 */
function getGroupId(index: number): string {
  return `group_${GROUP_LETTERS[index]?.toLowerCase() || index}`;
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
 * Distribute teams into groups
 * Uses serpentine/snake draft to balance group strength
 */
function distributeTeamsIntoGroups(
  teams: { id: string; seed?: number }[],
  groupCount: number
): Map<string, { id: string; seed?: number }[]> {
  const groups = new Map<string, { id: string; seed?: number }[]>();

  // Initialize groups
  for (let i = 0; i < groupCount; i++) {
    groups.set(getGroupId(i), []);
  }

  // Sort teams by seed (if available)
  const sortedTeams = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  // Serpentine distribution
  let groupIndex = 0;
  let direction = 1; // 1 = forward, -1 = backward

  for (const team of sortedTeams) {
    const groupId = getGroupId(groupIndex);
    groups.get(groupId)!.push(team);

    // Move to next group (serpentine pattern)
    groupIndex += direction;

    if (groupIndex >= groupCount) {
      groupIndex = groupCount - 1;
      direction = -1;
    } else if (groupIndex < 0) {
      groupIndex = 0;
      direction = 1;
    }
  }

  return groups;
}

/**
 * Generate round-robin pairings using the circle method
 */
function generateRoundRobinPairings(
  teamIds: string[],
  includeReturnGames: boolean,
  groupId: string
): Array<{ home: string; away: string; round: number; stage: string }> {
  const pairings: Array<{ home: string; away: string; round: number; stage: string }> = [];
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
          stage: groupId,
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
      stage: pairing.stage,
    }));
    pairings.push(...returnPairings);
  }

  return pairings;
}

/**
 * Calculate standings from match results for group stage
 */
function calculateGroupStandings(
  context: StandingsContext
): LeagueTableRow[] {
  const { matches, settings, stageFilter } = context;

  // Filter matches by stage/group if specified
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

  // Get points configuration
  const pointsPerWin = isGroupsKnockoutSettings(settings) ? settings.pointsPerWin : 3;
  const pointsPerDraw = isGroupsKnockoutSettings(settings) ? settings.pointsPerDraw : 1;
  const pointsPerLoss = isGroupsKnockoutSettings(settings) ? settings.pointsPerLoss : 0;
  const tieBreakers = isGroupsKnockoutSettings(settings)
    ? settings.tieBreakers
    : ['head_to_head', 'goal_difference', 'goals_scored'];

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
        stats.wins * pointsPerWin +
        stats.draws * pointsPerDraw +
        stats.losses * pointsPerLoss,
    })
  );

  // Sort by points, then by tie-breakers
  rows.sort((a, b) => {
    // Primary: points
    if (b.points !== a.points) return b.points - a.points;

    // Apply tie-breakers in order
    for (const tieBreaker of tieBreakers) {
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
        case 'fair_play':
          // Requires additional context - skip in basic calculation
          break;
      }
    }

    return 0;
  });

  return rows;
}

/**
 * Groups + Knockout Handler Implementation
 */
export const GroupsKnockoutHandler: TournamentHandler = {
  key: 'groups_knockout' as TournamentHandlerKey,
  nameKey: 'tournament.modes.groupsKnockout.name',
  descriptionKey: 'tournament.modes.groupsKnockout.description',
  phases: getHandlerPhases('groups_knockout'),
  defaultSettings: DEFAULT_GROUPS_KNOCKOUT_SETTINGS,

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
    const zodResult = groupsKnockoutSettingsSchema.safeParse(settings);
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

    if (!isGroupsKnockoutSettings(settings)) {
      result.valid = false;
      result.errors.push({
        field: 'settings',
        messageKey: 'tournament.validation.invalidGroupsKnockoutSettings',
      });
      return result;
    }

    // Calculate required teams
    const requiredTeams = settings.groupCount * settings.teamsPerGroup;
    const advancingTeams = settings.groupCount * settings.advancingPerGroup;

    // Team count validations
    if (teamCount !== undefined) {
      if (teamCount < requiredTeams) {
        result.errors.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.notEnoughTeamsForGroups',
          params: { count: teamCount, required: requiredTeams },
        });
        result.valid = false;
      } else if (teamCount > requiredTeams) {
        result.warnings.push({
          field: 'teamCount',
          messageKey: 'tournament.validation.extraTeamsWarning',
          params: { count: teamCount, required: requiredTeams },
        });
      }

      // Validate knockout bracket size
      const validBracketSizes = [2, 4, 8, 16, 32];
      if (!validBracketSizes.includes(advancingTeams)) {
        result.warnings.push({
          field: 'advancingTeams',
          messageKey: 'tournament.validation.advancingTeamsNotPowerOfTwo',
          params: { count: advancingTeams },
        });
      }
    }

    // Validate advancing per group doesn't exceed teams per group
    if (settings.advancingPerGroup > settings.teamsPerGroup) {
      result.errors.push({
        field: 'advancingPerGroup',
        messageKey: 'tournament.validation.tooManyAdvancing',
      });
      result.valid = false;
    }

    return result;
  },

  generateMatches(context: MatchGenerationContext): MatchGenerationResult {
    const { teams, phase, settings } = context;

    if (!isGroupsKnockoutSettings(settings)) {
      return {
        success: false,
        matches: [],
        errors: ['Invalid settings for Groups + Knockout mode'],
      };
    }

    // Group stage: distribute teams and generate round-robin
    if (phase.id === 'group_stage' || phase.id.startsWith('group_')) {
      const teamsWithSeeds = teams.map((t, index) => ({
        id: t.id,
        seed: t.seed ?? index + 1,
      }));

      // Distribute teams into groups
      const groups = distributeTeamsIntoGroups(teamsWithSeeds, settings.groupCount);

      // Generate matches for each group
      const allMatches: Array<{
        home_team_id: string;
        away_team_id: string;
        stage: string;
        round: number;
        group?: string;
      }> = [];

      groups.forEach((groupTeams, groupId) => {
        const groupTeamIds = groupTeams.map((t) => t.id);
        const groupPairings = generateRoundRobinPairings(
          groupTeamIds,
          settings.doubleRoundRobin,
          groupId
        );

        for (const pairing of groupPairings) {
          allMatches.push({
            home_team_id: pairing.home,
            away_team_id: pairing.away,
            stage: pairing.stage,
            round: pairing.round,
            group: groupId,
          });
        }
      });

      return {
        success: true,
        matches: allMatches,
        metadata: {
          groups: Object.fromEntries(groups),
        },
      };
    }

    // Knockout stage: generate bracket pairings
    if (phase.matchGeneration.type === 'knockout') {
      // This would use teams that advanced from groups
      // In practice, this is called after group stage is complete
      const pairings: Array<{
        home_team_id: string;
        away_team_id: string;
        stage: string;
        round: number;
      }> = [];

      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          pairings.push({
            home_team_id: teams[i].id,
            away_team_id: teams[i + 1].id,
            stage: phase.id,
            round: 1,
          });
        }
      }

      return {
        success: true,
        matches: pairings,
      };
    }

    return {
      success: false,
      matches: [],
      errors: [`Unknown phase type: ${phase.matchGeneration.type}`],
    };
  },

  calculateStandings(context: StandingsContext): LeagueTableRow[] {
    return calculateGroupStandings(context);
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
registerHandler(GroupsKnockoutHandler);

export default GroupsKnockoutHandler;
