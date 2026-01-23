/**
 * Swiss System Tournament Handler
 *
 * Implements the Swiss System tournament format (NCL's current format).
 * Swiss pairing algorithm ensures balanced competition with snake seeding
 * for poule assignment.
 *
 * Flow:
 * [Start] → [Phase 1 (Swiss rounds)] → [Snake Seeding] → [Poule A (top)] → [Final]
 *                                                      ↘ [Poule B (bottom)]
 */

import type {
  TournamentHandler,
  TournamentHandlerKey,
  PhaseConfig,
  ValidationResult,
  MatchGenerationResult,
  MatchGenerationContext,
  StandingsContext,
  NextPhaseContext,
} from '@/types/tournament-handlers';
import type {
  SwissSystemSettings,
  TieBreakerCriteria,
} from '@/types/tournament-settings';
import { DEFAULT_SWISS_SYSTEM_SETTINGS } from '@/types/tournament-settings';
import { registerHandler, getHandlerPhases } from '../handler-registry';
import type { LeagueTableRow } from '@/hooks/use-league-table';

/**
 * Generate Swiss pairings for a single round
 * Teams are paired by similar standings (1v2, 3v4, etc.)
 */
function generateSwissPairings(
  teams: Array<{ id: string; name: string }>,
  standings: LeagueTableRow[],
  previousPairings: Set<string>
): Array<{ home: string; away: string }> {
  // Sort teams by current standings
  const sortedTeams = [...teams].sort((a, b) => {
    const aRank = standings.findIndex(s => s.team_id === a.id);
    const bRank = standings.findIndex(s => s.team_id === b.id);
    // If not in standings, place at end
    if (aRank === -1) return 1;
    if (bRank === -1) return -1;
    return aRank - bRank;
  });

  const pairings: Array<{ home: string; away: string }> = [];
  const paired = new Set<string>();

  // Pair adjacent teams in standings
  for (let i = 0; i < sortedTeams.length; i++) {
    const team = sortedTeams[i];
    if (paired.has(team.id)) continue;

    // Find best opponent (next unpaired team that hasn't played this team)
    for (let j = i + 1; j < sortedTeams.length; j++) {
      const opponent = sortedTeams[j];
      if (paired.has(opponent.id)) continue;

      // Check if they've already played
      const pairingKey1 = `${team.id}-${opponent.id}`;
      const pairingKey2 = `${opponent.id}-${team.id}`;

      if (!previousPairings.has(pairingKey1) && !previousPairings.has(pairingKey2)) {
        // Alternate home/away based on index
        if (i % 2 === 0) {
          pairings.push({ home: team.id, away: opponent.id });
        } else {
          pairings.push({ home: opponent.id, away: team.id });
        }
        paired.add(team.id);
        paired.add(opponent.id);
        break;
      }
    }

    // If no valid opponent found, pair with nearest available
    if (!paired.has(team.id)) {
      for (let j = i + 1; j < sortedTeams.length; j++) {
        const opponent = sortedTeams[j];
        if (paired.has(opponent.id)) continue;

        if (i % 2 === 0) {
          pairings.push({ home: team.id, away: opponent.id });
        } else {
          pairings.push({ home: opponent.id, away: team.id });
        }
        paired.add(team.id);
        paired.add(opponent.id);
        break;
      }
    }
  }

  return pairings;
}

/**
 * Apply snake seeding to divide teams into poules
 * Pattern example for 8 teams into 2 poules:
 * Standings: 1, 2, 3, 4, 5, 6, 7, 8
 * Pattern: [[1,4,5,8], [2,3,6,7]]
 * Poule A: 1st, 4th, 5th, 8th
 * Poule B: 2nd, 3rd, 6th, 7th
 */
function applySnakeSeeding(
  standings: LeagueTableRow[],
  pattern: number[][]
): Array<{ poule: string; teams: string[] }> {
  const poules: Array<{ poule: string; teams: string[] }> = [];

  pattern.forEach((positions, pouleIndex) => {
    const pouleTeams: string[] = [];

    positions.forEach(pos => {
      // positions are 1-indexed
      const team = standings[pos - 1];
      if (team) {
        pouleTeams.push(team.team_id);
      }
    });

    poules.push({
      poule: pouleIndex === 0 ? 'poule_a' : 'poule_b',
      teams: pouleTeams,
    });
  });

  return poules;
}

/**
 * Generate round-robin pairings for a poule
 */
function generatePoulePairings(
  teams: string[],
  doubleRoundRobin: boolean
): Array<{ home: string; away: string }> {
  const pairings: Array<{ home: string; away: string }> = [];

  // Standard round-robin
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairings.push({
        home: teams[i],
        away: teams[j],
      });
    }
  }

  // Double round-robin: add return fixtures
  if (doubleRoundRobin) {
    const returnFixtures = pairings.map(p => ({
      home: p.away,
      away: p.home,
    }));
    pairings.push(...returnFixtures);
  }

  return pairings;
}

/**
 * Swiss System Tournament Handler
 */
export const SwissSystemHandler: TournamentHandler = {
  key: 'swiss_system' as TournamentHandlerKey,
  nameKey: 'tournament.modes.swissSystem.name',
  phases: getHandlerPhases('swiss_system'),
  defaultSettings: DEFAULT_SWISS_SYSTEM_SETTINGS,

  /**
   * Validate Swiss System settings
   */
  validateSettings(settings: unknown, teamCount?: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type check
    if (!settings || typeof settings !== 'object') {
      return { valid: false, errors: ['Invalid settings object'], warnings: [] };
    }

    const s = settings as SwissSystemSettings;

    // Validate required fields
    if (typeof s.phase1Rounds !== 'number' || s.phase1Rounds < 1) {
      errors.push('tournament.validation.invalidPhase1Rounds');
    }

    if (!Array.isArray(s.snakeSeedingPattern) || s.snakeSeedingPattern.length < 2) {
      errors.push('tournament.validation.minTwoPoules');
    }

    // Validate snake seeding pattern
    if (s.snakeSeedingPattern) {
      const allPositions = s.snakeSeedingPattern.flat();
      const uniquePositions = new Set(allPositions);

      // Check for duplicates
      if (allPositions.length !== uniquePositions.size) {
        errors.push('tournament.validation.duplicateSnakePositions');
      }

      // Check all poules have same size
      const pouleSizes = s.snakeSeedingPattern.map(p => p.length);
      if (new Set(pouleSizes).size > 1) {
        errors.push('tournament.validation.equalPouleSize');
      }
    }

    // Validate points system
    if (typeof s.pointsPerWin !== 'number' || s.pointsPerWin < 0) {
      errors.push('tournament.validation.invalidPointsPerWin');
    }

    // Validate tie-breakers
    if (!Array.isArray(s.tieBreakers) || s.tieBreakers.length === 0) {
      errors.push('tournament.validation.atLeastOneTieBreaker');
    }

    // Team count validation
    if (teamCount !== undefined) {
      const requiredTeams = s.snakeSeedingPattern ?
        Math.max(...s.snakeSeedingPattern.flat()) : 8;

      if (teamCount < requiredTeams) {
        errors.push('tournament.validation.notEnoughTeamsForSwiss');
      }

      // Warning for many Swiss rounds
      if (s.phase1Rounds > teamCount - 1) {
        warnings.push('tournament.validation.tooManySwissRounds');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Generate matches for a Swiss System phase
   */
  generateMatches(context: MatchGenerationContext): MatchGenerationResult {
    const { teams, settings, phaseId, existingMatches } = context;
    const s = settings as SwissSystemSettings;

    // Build set of previous pairings
    const previousPairings = new Set<string>();
    existingMatches?.forEach(m => {
      if (m.home_team?.id && m.away_team?.id) {
        previousPairings.add(`${m.home_team.id}-${m.away_team.id}`);
      }
    });

    // Calculate current standings from existing matches
    const standings = this.calculateStandings({
      matches: existingMatches || [],
      settings: s,
    });

    const matches: MatchGenerationResult['matches'] = [];

    switch (phaseId) {
      case 'phase1':
      case 'regular_season': {
        // Generate Swiss pairings for Phase 1
        const pairings = generateSwissPairings(
          teams.map(t => ({ id: t.id, name: t.name })),
          standings,
          previousPairings
        );

        pairings.forEach(pairing => {
          matches.push({
            home_team_id: pairing.home,
            away_team_id: pairing.away,
            stage: 'phase1',
          });
        });
        break;
      }

      case 'poule_a':
      case 'poule_b': {
        // Apply snake seeding to get poule assignments
        const poules = applySnakeSeeding(standings, s.snakeSeedingPattern);
        const poule = poules.find(p => p.poule === phaseId);

        if (!poule) {
          return {
            success: false,
            matches: [],
            error: 'Could not determine poule assignment',
          };
        }

        // Generate round-robin for this poule
        const poulePairings = generatePoulePairings(
          poule.teams,
          s.pouleFormat === 'round_robin' && s.doubleRoundRobin
        );

        poulePairings.forEach(pairing => {
          matches.push({
            home_team_id: pairing.home,
            away_team_id: pairing.away,
            stage: phaseId,
          });
        });
        break;
      }

      case 'final': {
        // Generate final stage matches based on poule standings
        // Top teams from Poule A vs Poule B
        const pouleAMatches = existingMatches?.filter(m => m.stage === 'poule_a') || [];
        const pouleBMatches = existingMatches?.filter(m => m.stage === 'poule_b') || [];

        const pouleAStandings = this.calculateStandings({
          matches: pouleAMatches,
          settings: s,
        });
        const pouleBStandings = this.calculateStandings({
          matches: pouleBMatches,
          settings: s,
        });

        const teamsInFinal = s.finalStageTeams;
        const teamsPerPoule = Math.floor(teamsInFinal / 2);

        // Semi-finals: 1A vs 2B, 1B vs 2A
        if (pouleAStandings.length >= teamsPerPoule && pouleBStandings.length >= teamsPerPoule) {
          // Semi-final 1: 1A vs 2B
          matches.push({
            home_team_id: pouleAStandings[0]?.team_id,
            away_team_id: pouleBStandings[1]?.team_id,
            stage: 'semi-final',
          });

          // Semi-final 2: 1B vs 2A
          matches.push({
            home_team_id: pouleBStandings[0]?.team_id,
            away_team_id: pouleAStandings[1]?.team_id,
            stage: 'semi-final',
          });

          // Note: Final and 3rd place matches are generated after semi-finals complete
        }
        break;
      }

      default:
        return {
          success: false,
          matches: [],
          error: `Unknown phase: ${phaseId}`,
        };
    }

    return {
      success: true,
      matches,
      metadata: {
        algorithm: phaseId === 'phase1' ? 'swiss_pairing' : 'round_robin',
        generatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * Calculate standings from matches
   */
  calculateStandings(context: StandingsContext): LeagueTableRow[] {
    const { matches, settings } = context;
    const s = settings as SwissSystemSettings;

    // Build team stats map
    const teamStats = new Map<string, LeagueTableRow>();

    matches.forEach(match => {
      if (match.status !== 'completed') return;
      if (!match.home_team?.id || !match.away_team?.id) return;

      const homeId = match.home_team.id;
      const awayId = match.away_team.id;
      const homeName = match.home_team.name || '';
      const awayName = match.away_team.name || '';

      // Initialize team stats if not exists
      if (!teamStats.has(homeId)) {
        teamStats.set(homeId, {
          team_id: homeId,
          team_name: homeName,
          team_logo: match.home_team.logo_url || null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        });
      }
      if (!teamStats.has(awayId)) {
        teamStats.set(awayId, {
          team_id: awayId,
          team_name: awayName,
          team_logo: match.away_team.logo_url || null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        });
      }

      const homeStats = teamStats.get(homeId)!;
      const awayStats = teamStats.get(awayId)!;

      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;

      // Update played
      homeStats.played++;
      awayStats.played++;

      // Update goals
      homeStats.goals_for += homeScore;
      homeStats.goals_against += awayScore;
      awayStats.goals_for += awayScore;
      awayStats.goals_against += homeScore;

      // Update results and points
      if (homeScore > awayScore) {
        homeStats.won++;
        homeStats.points += s.pointsPerWin;
        awayStats.lost++;
        awayStats.points += s.pointsPerLoss;
      } else if (awayScore > homeScore) {
        awayStats.won++;
        awayStats.points += s.pointsPerWin;
        homeStats.lost++;
        homeStats.points += s.pointsPerLoss;
      } else {
        homeStats.drawn++;
        awayStats.drawn++;
        homeStats.points += s.pointsPerDraw;
        awayStats.points += s.pointsPerDraw;
      }

      // Update goal difference
      homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against;
      awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;
    });

    // Sort by tie-breakers
    const standings = Array.from(teamStats.values()).sort((a, b) => {
      // Primary: points
      if (b.points !== a.points) return b.points - a.points;

      // Apply tie-breakers
      for (const tieBreaker of s.tieBreakers) {
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
            if (b.won !== a.won) {
              return b.won - a.won;
            }
            break;
          case 'head_to_head':
            // Would need match-by-match analysis
            break;
        }
      }

      // Fallback: alphabetical
      return a.team_name.localeCompare(b.team_name);
    });

    return standings;
  },

  /**
   * Determine next phase based on current standings
   */
  getNextPhase(context: NextPhaseContext): PhaseConfig | null {
    const { currentPhaseId, phases } = context;

    const currentIndex = phases.findIndex(p => p.id === currentPhaseId);
    if (currentIndex === -1) return null;

    const nextPhase = phases[currentIndex + 1];
    if (!nextPhase || nextPhase.isTerminal) return null;

    return nextPhase;
  },

  /**
   * Get teams advancing from a phase
   */
  getAdvancingTeams(
    standings: LeagueTableRow[],
    rules?: { count?: number; positions?: number[] }
  ): string[] {
    if (rules?.positions) {
      return rules.positions
        .filter(pos => standings[pos - 1])
        .map(pos => standings[pos - 1].team_id);
    }

    const count = rules?.count || standings.length;
    return standings.slice(0, count).map(s => s.team_id);
  },
};

// Register the handler
registerHandler(SwissSystemHandler);
