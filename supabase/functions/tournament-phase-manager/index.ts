import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// =============================================================================
// CORS Headers
// =============================================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// Types
// =============================================================================
type TournamentHandlerKey = 'league_only' | 'knockout' | 'groups_knockout' | 'swiss_system' | 'round_robin_final';

interface PhaseConfig {
  id: string;
  nameKey: string;
  order: number;
  matchGeneration: {
    type: 'round_robin' | 'knockout' | 'swiss_pairing' | 'group_assignment';
    includeReturnGames?: boolean;
    bracketSize?: number;
  };
  advancementRules?: AdvancementRule[];
  isTerminal: boolean;
}

interface AdvancementRule {
  count: number;
  from: 'top' | 'bottom';
  toPhase: string;
  fromGroup?: string;
}

interface TournamentMode {
  id: string;
  name: string;
  handler_key: TournamentHandlerKey;
  settings: Record<string, unknown>;
}

interface TeamStanding {
  team_id: string;
  team_name?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface GeneratedMatch {
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  status: string;
  stage: string;
}

// =============================================================================
// Phase Configurations per Handler
// =============================================================================
const HANDLER_PHASES: Record<TournamentHandlerKey, PhaseConfig[]> = {
  league_only: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, matchGeneration: { type: 'round_robin' }, isTerminal: false },
    { id: 'regular_season', nameKey: 'tournament.phases.regularSeason', order: 1, matchGeneration: { type: 'round_robin', includeReturnGames: true }, isTerminal: true },
  ],
  knockout: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, matchGeneration: { type: 'knockout' }, isTerminal: false },
    { id: 'quarter-final', nameKey: 'tournament.phases.quarterFinal', order: 1, matchGeneration: { type: 'knockout' }, advancementRules: [{ count: 4, from: 'top', toPhase: 'semi-final' }], isTerminal: false },
    { id: 'semi-final', nameKey: 'tournament.phases.semiFinal', order: 2, matchGeneration: { type: 'knockout' }, advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }], isTerminal: false },
    { id: 'third-place_playoff', nameKey: 'tournament.phases.thirdPlace', order: 3, matchGeneration: { type: 'knockout' }, isTerminal: true },
    { id: 'final', nameKey: 'tournament.phases.final', order: 4, matchGeneration: { type: 'knockout' }, isTerminal: true },
  ],
  groups_knockout: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, matchGeneration: { type: 'group_assignment' }, isTerminal: false },
    { id: 'group_stage', nameKey: 'tournament.phases.groupStage', order: 1, matchGeneration: { type: 'round_robin' }, advancementRules: [{ count: 2, from: 'top', toPhase: 'knockout' }], isTerminal: false },
    { id: 'knockout', nameKey: 'tournament.phases.knockout', order: 2, matchGeneration: { type: 'knockout' }, isTerminal: false },
    { id: 'final', nameKey: 'tournament.phases.final', order: 3, matchGeneration: { type: 'knockout' }, isTerminal: true },
  ],
  swiss_system: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, matchGeneration: { type: 'swiss_pairing' }, isTerminal: false },
    { id: 'regular_season', nameKey: 'tournament.phases.phase1', order: 1, matchGeneration: { type: 'swiss_pairing' }, advancementRules: [{ count: 4, from: 'top', toPhase: 'poule_a' }, { count: 4, from: 'bottom', toPhase: 'poule_b' }], isTerminal: false },
    { id: 'poule_a', nameKey: 'tournament.phases.pouleA', order: 2, matchGeneration: { type: 'round_robin' }, advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }], isTerminal: false },
    { id: 'poule_b', nameKey: 'tournament.phases.pouleB', order: 2, matchGeneration: { type: 'round_robin' }, isTerminal: true },
    { id: 'final', nameKey: 'tournament.phases.final', order: 3, matchGeneration: { type: 'knockout' }, isTerminal: true },
  ],
  round_robin_final: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, matchGeneration: { type: 'round_robin' }, isTerminal: false },
    { id: 'regular_season', nameKey: 'tournament.phases.regularSeason', order: 1, matchGeneration: { type: 'round_robin', includeReturnGames: true }, advancementRules: [{ count: 4, from: 'top', toPhase: 'semi-final' }], isTerminal: false },
    { id: 'semi-final', nameKey: 'tournament.phases.semiFinal', order: 2, matchGeneration: { type: 'knockout' }, advancementRules: [{ count: 2, from: 'top', toPhase: 'final' }], isTerminal: false },
    { id: 'final', nameKey: 'tournament.phases.final', order: 3, matchGeneration: { type: 'knockout' }, isTerminal: true },
  ],
};

// Legacy phase name mapping for backwards compatibility
const LEGACY_PHASE_MAP: Record<string, string> = {
  'Inizio Torneo': 'start',
  'Fase 1': 'regular_season',
  'Fase 2': 'poule_a', // For swiss_system, closing poule phases
  'Fase 3': 'final',
};

// =============================================================================
// Helper Functions
// =============================================================================

async function isUserAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.error('Authentication error:', userError?.message);
    return false;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError?.message);
    return false;
  }

  return profile.role === 'admin';
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalizeHandlerKey(key: string): TournamentHandlerKey {
  const legacyMap: Record<string, TournamentHandlerKey> = {
    generate_playoffs: 'swiss_system',
    default: 'league_only',
  };

  if (key in HANDLER_PHASES) {
    return key as TournamentHandlerKey;
  }
  return legacyMap[key] ?? 'league_only';
}

function normalizePhaseId(phaseId: string): string {
  return LEGACY_PHASE_MAP[phaseId] ?? phaseId;
}

function getPhaseConfig(handlerKey: TournamentHandlerKey, phaseId: string): PhaseConfig | undefined {
  const phases = HANDLER_PHASES[handlerKey];
  return phases?.find(p => p.id === phaseId);
}

function getNextPhase(handlerKey: TournamentHandlerKey, currentPhaseId: string): PhaseConfig | null {
  const phases = HANDLER_PHASES[handlerKey];
  const currentPhase = phases?.find(p => p.id === currentPhaseId);

  if (!currentPhase || currentPhase.isTerminal) {
    return null;
  }

  const nextPhases = phases.filter(p => p.order > currentPhase.order);
  if (nextPhases.length === 0) return null;

  return nextPhases.sort((a, b) => a.order - b.order)[0];
}

// =============================================================================
// Match Generation Algorithms
// =============================================================================

function generateRoundRobinMatches(
  teams: { team_id: string }[],
  stage: string,
  competition_id: string,
  season_id: string,
  includeReturnGames = false
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  const teamList = [...teams];

  if (teamList.length % 2 !== 0) {
    teamList.push({ team_id: 'BYE' });
  }

  const numRounds = teamList.length - 1;
  const halfSize = teamList.length / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teamList[i];
      const away = teamList[teamList.length - 1 - i];

      if (home.team_id !== 'BYE' && away.team_id !== 'BYE') {
        matches.push({
          competition_id,
          season_id,
          home_team_id: home.team_id,
          away_team_id: away.team_id,
          match_date: new Date().toISOString(),
          status: 'scheduled',
          stage,
        });
      }
    }
    const lastTeam = teamList.pop();
    if (lastTeam) {
      teamList.splice(1, 0, lastTeam);
    }
  }

  if (includeReturnGames) {
    const returnMatches = matches.map(m => ({
      ...m,
      home_team_id: m.away_team_id,
      away_team_id: m.home_team_id,
    }));
    matches.push(...returnMatches);
  }

  return matches;
}

function generateKnockoutMatches(
  teams: { team_id: string; seed?: number }[],
  stage: string,
  competition_id: string,
  season_id: string,
  seedingMethod: 'random' | 'seeded' | 'manual' = 'seeded'
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];

  let orderedTeams = [...teams];

  if (seedingMethod === 'random') {
    orderedTeams = shuffleArray(orderedTeams);
  } else if (seedingMethod === 'seeded') {
    orderedTeams.sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    orderedTeams = arrangeBracketSeeding(orderedTeams);
  }

  for (let i = 0; i < orderedTeams.length; i += 2) {
    if (i + 1 < orderedTeams.length) {
      matches.push({
        competition_id,
        season_id,
        home_team_id: orderedTeams[i].team_id,
        away_team_id: orderedTeams[i + 1].team_id,
        match_date: new Date().toISOString(),
        status: 'scheduled',
        stage,
      });
    }
  }

  return matches;
}

function arrangeBracketSeeding(teams: { team_id: string; seed?: number }[]): { team_id: string; seed?: number }[] {
  const n = teams.length;
  const positions = getBracketPositions(n);
  const arranged: { team_id: string; seed?: number }[] = new Array(n);

  for (let i = 0; i < n; i++) {
    arranged[positions[i]] = teams[i];
  }

  return arranged;
}

function getBracketPositions(size: number): number[] {
  if (size === 2) return [0, 1];
  if (size === 4) return [0, 3, 2, 1];
  if (size === 8) return [0, 7, 4, 3, 2, 5, 6, 1];
  if (size === 16) return [0, 15, 8, 7, 4, 11, 12, 3, 2, 13, 10, 5, 6, 9, 14, 1];
  return Array.from({ length: size }, (_, i) => i);
}

function generateSwissPairingMatches(
  teams: { team_id: string }[],
  standings: TeamStanding[],
  stage: string,
  competition_id: string,
  season_id: string
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];

  // Sort teams by standings (points, goal difference)
  const sortedTeams = [...teams].sort((a, b) => {
    const standingA = standings.find(s => s.team_id === a.team_id);
    const standingB = standings.find(s => s.team_id === b.team_id);

    if (!standingA && !standingB) return 0;
    if (!standingA) return 1;
    if (!standingB) return -1;

    if (standingB.points !== standingA.points) {
      return standingB.points - standingA.points;
    }
    return standingB.goal_difference - standingA.goal_difference;
  });

  // Pair adjacent teams (1v2, 3v4, etc.)
  for (let i = 0; i < sortedTeams.length; i += 2) {
    if (i + 1 < sortedTeams.length) {
      matches.push({
        competition_id,
        season_id,
        home_team_id: sortedTeams[i].team_id,
        away_team_id: sortedTeams[i + 1].team_id,
        match_date: new Date().toISOString(),
        status: 'scheduled',
        stage,
      });
    }
  }

  return matches;
}

function applySnakeSeeding(
  standings: TeamStanding[],
  settings: Record<string, unknown>
): { pouleA: { team_id: string }[]; pouleB: { team_id: string }[] } {
  const snakeSeedingPattern = settings.snakeSeedingPattern as number[][] ?? [[1, 4, 5, 8], [2, 3, 6, 7]];

  const pouleA: { team_id: string }[] = [];
  const pouleB: { team_id: string }[] = [];

  standings.forEach((team, index) => {
    const rank = index + 1;
    const patternA = snakeSeedingPattern[0] ?? [1, 4, 5, 8, 9, 12];
    const patternB = snakeSeedingPattern[1] ?? [2, 3, 6, 7, 10, 11];

    if (patternA.includes(rank)) {
      pouleA.push({ team_id: team.team_id });
    } else if (patternB.includes(rank)) {
      pouleB.push({ team_id: team.team_id });
    }
  });

  return { pouleA, pouleB };
}

function getAdvancingTeams(
  standings: TeamStanding[],
  rules: AdvancementRule[]
): { team_id: string; seed: number }[] {
  const advancing: { team_id: string; seed: number }[] = [];

  for (const rule of rules) {
    const sorted = [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goal_difference - a.goal_difference;
    });

    const selected = rule.from === 'top'
      ? sorted.slice(0, rule.count)
      : sorted.slice(-rule.count);

    selected.forEach((team, idx) => {
      advancing.push({
        team_id: team.team_id,
        seed: rule.from === 'top' ? idx + 1 : standings.length - rule.count + idx + 1
      });
    });
  }

  return advancing;
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth check
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const isAdmin = await isUserAdmin(userSupabaseClient);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Access denied: User is not an admin.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request
    const { season_id, phase_to_close, manual_overrides } = await req.json();
    if (!season_id || !phase_to_close) {
      return new Response(JSON.stringify({ error: 'season_id and phase_to_close are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Admin client
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Log manual overrides
    if (manual_overrides) {
      const { data: { user } } = await userSupabaseClient.auth.getUser();
      await adminSupabaseClient.from('audit_log').insert({
        user_id: user?.id,
        season_id,
        action_description: `Manual override for closing phase: ${phase_to_close}`,
        details: manual_overrides,
      });
    }

    // 5. Load season with tournament mode
    const { data: seasonData, error: seasonError } = await adminSupabaseClient
      .from('seasons')
      .select('*, competitions(id), tournament_modes(id, name, handler_key, settings)')
      .eq('id', season_id)
      .single();

    if (seasonError || !seasonData) {
      throw new Error('Could not retrieve season data.');
    }

    const competition_id = (seasonData as any).competitions?.id;
    if (!competition_id) {
      throw new Error('Competition ID not found for the given season.');
    }

    // 6. Get tournament mode configuration
    const tournamentMode = (seasonData as any).tournament_modes as TournamentMode | null;
    const handlerKey = normalizeHandlerKey(tournamentMode?.handler_key ?? 'swiss_system');
    const settings = tournamentMode?.settings ?? {};

    // Normalize phase ID for backwards compatibility
    const phaseId = normalizePhaseId(phase_to_close);
    const currentPhase = getPhaseConfig(handlerKey, phaseId);
    const nextPhase = getNextPhase(handlerKey, phaseId);

    console.log(`Processing phase transition: ${phaseId} -> ${nextPhase?.id ?? 'END'} (handler: ${handlerKey})`);

    // 7. Load teams
    const { data: seasonTeams, error: teamsError } = await adminSupabaseClient
      .from('season_teams')
      .select('team_id')
      .eq('season_id', season_id);

    if (teamsError) throw teamsError;
    if (!seasonTeams || seasonTeams.length < 2) {
      throw new Error('Not enough teams in the season.');
    }

    let newMatches: GeneratedMatch[] = [];

    // 8. Phase-specific logic based on handler type
    if (phaseId === 'start') {
      // Starting the tournament - generate first phase matches
      const firstPlayablePhase = HANDLER_PHASES[handlerKey].find(p => p.id !== 'start');

      if (!firstPlayablePhase) {
        throw new Error('No playable phases found for handler.');
      }

      const targetStage = firstPlayablePhase.id;
      const matchGenType = firstPlayablePhase.matchGeneration.type;

      switch (matchGenType) {
        case 'round_robin':
          newMatches = generateRoundRobinMatches(
            seasonTeams,
            targetStage,
            competition_id,
            season_id,
            firstPlayablePhase.matchGeneration.includeReturnGames ?? false
          );
          break;

        case 'knockout':
          const shuffledTeams = shuffleArray(seasonTeams).map((t, i) => ({ ...t, seed: i + 1 }));
          newMatches = generateKnockoutMatches(
            shuffledTeams,
            targetStage,
            competition_id,
            season_id,
            (settings.seedingMethod as 'random' | 'seeded' | 'manual') ?? 'random'
          );
          break;

        case 'swiss_pairing':
          // First Swiss round: random pairing
          const shuffled = shuffleArray(seasonTeams);
          for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
              newMatches.push({
                competition_id,
                season_id,
                home_team_id: shuffled[i].team_id,
                away_team_id: shuffled[i + 1].team_id,
                match_date: new Date().toISOString(),
                status: 'scheduled',
                stage: targetStage,
              });
            }
          }
          break;

        case 'group_assignment':
          // Groups + Knockout: assign teams to groups and generate group matches
          const groupCount = (settings.groupCount as number) ?? 4;
          const teamsPerGroup = Math.ceil(seasonTeams.length / groupCount);
          const shuffledForGroups = shuffleArray(seasonTeams);

          for (let g = 0; g < groupCount; g++) {
            const groupTeams = shuffledForGroups.slice(g * teamsPerGroup, (g + 1) * teamsPerGroup);
            const groupStage = `group_${String.fromCharCode(97 + g)}`; // group_a, group_b, etc.

            const groupMatches = generateRoundRobinMatches(
              groupTeams,
              groupStage,
              competition_id,
              season_id,
              (settings.doubleRoundRobin as boolean) ?? false
            );
            newMatches.push(...groupMatches);
          }
          break;
      }
    } else if (nextPhase) {
      // Transitioning between phases

      // Get standings for current phase
      const stageFilter = phaseId.startsWith('group_')
        ? phaseId
        : (phaseId === 'regular_season' || phaseId === 'poule_a' || phaseId === 'poule_b' ? phaseId : null);

      const { data: standings, error: standingsError } = await adminSupabaseClient.rpc('get_ncl_standings', {
        p_competition_id: competition_id,
        p_season_id: season_id,
        p_stage_filter: stageFilter,
      });

      if (standingsError) throw standingsError;

      // Save phase snapshot
      await adminSupabaseClient.from('phase_snapshots').insert({
        season_id,
        phase_name: phaseId,
        snapshot_data: standings,
      });

      // Handle Swiss System special case: phase 1 -> poules
      if (handlerKey === 'swiss_system' && phaseId === 'regular_season') {
        const { pouleA, pouleB } = applySnakeSeeding(standings, settings);

        const pouleAMatches = generateRoundRobinMatches(pouleA, 'poule_a', competition_id, season_id);
        const pouleBMatches = generateRoundRobinMatches(pouleB, 'poule_b', competition_id, season_id);
        newMatches = [...pouleAMatches, ...pouleBMatches];
      }
      // Handle Swiss System: poules -> final
      else if (handlerKey === 'swiss_system' && (phaseId === 'poule_a' || phaseId === 'poule_b')) {
        // Check if both poules are complete
        const otherPoule = phaseId === 'poule_a' ? 'poule_b' : 'poule_a';
        const { data: otherStandings } = await adminSupabaseClient.rpc('get_ncl_standings', {
          p_competition_id: competition_id,
          p_season_id: season_id,
          p_stage_filter: otherPoule,
        });

        if (otherStandings && otherStandings.length > 0) {
          // Get winner from each poule
          const pouleAStandings = phaseId === 'poule_a' ? standings : otherStandings;
          const pouleBStandings = phaseId === 'poule_b' ? standings : otherStandings;

          // Save other poule snapshot
          await adminSupabaseClient.from('phase_snapshots').insert({
            season_id,
            phase_name: otherPoule,
            snapshot_data: otherStandings,
          });

          // Generate final: 1A vs 1B
          const winner1A = pouleAStandings[0]?.team_id;
          const winner1B = pouleBStandings[0]?.team_id;
          const runner2A = pouleAStandings[1]?.team_id;
          const runner2B = pouleBStandings[1]?.team_id;

          if (winner1A && winner1B) {
            // Semi-finals if configured, otherwise direct final
            if (settings.finalStageTeams === 4 && runner2A && runner2B) {
              // Semi-finals: 1A vs 2B, 1B vs 2A
              newMatches.push({
                competition_id,
                season_id,
                home_team_id: winner1A,
                away_team_id: runner2B,
                match_date: new Date().toISOString(),
                status: 'scheduled',
                stage: 'semi-final',
              });
              newMatches.push({
                competition_id,
                season_id,
                home_team_id: winner1B,
                away_team_id: runner2A,
                match_date: new Date().toISOString(),
                status: 'scheduled',
                stage: 'semi-final',
              });
            } else {
              // Direct final
              newMatches.push({
                competition_id,
                season_id,
                home_team_id: winner1A,
                away_team_id: winner1B,
                match_date: new Date().toISOString(),
                status: 'scheduled',
                stage: 'final',
              });
            }
          }
        }
      }
      // Generic phase advancement using rules
      else if (currentPhase?.advancementRules && currentPhase.advancementRules.length > 0) {
        const advancingTeams = getAdvancingTeams(standings, currentPhase.advancementRules);
        const targetPhase = currentPhase.advancementRules[0].toPhase;
        const targetPhaseConfig = getPhaseConfig(handlerKey, targetPhase);

        if (targetPhaseConfig) {
          switch (targetPhaseConfig.matchGeneration.type) {
            case 'knockout':
              newMatches = generateKnockoutMatches(
                advancingTeams,
                targetPhase,
                competition_id,
                season_id,
                (settings.seedingMethod as 'random' | 'seeded' | 'manual') ?? 'seeded'
              );
              break;

            case 'round_robin':
              newMatches = generateRoundRobinMatches(
                advancingTeams,
                targetPhase,
                competition_id,
                season_id,
                targetPhaseConfig.matchGeneration.includeReturnGames ?? false
              );
              break;
          }
        }
      }
      // Handle Groups + Knockout: group_stage -> knockout
      else if (handlerKey === 'groups_knockout' && phaseId === 'group_stage') {
        // Get all group standings and determine advancing teams
        const groupCount = (settings.groupCount as number) ?? 4;
        const advancingPerGroup = (settings.advancingPerGroup as number) ?? 2;
        const allAdvancing: { team_id: string; seed: number }[] = [];

        for (let g = 0; g < groupCount; g++) {
          const groupId = `group_${String.fromCharCode(97 + g)}`;
          const { data: groupStandings } = await adminSupabaseClient.rpc('get_ncl_standings', {
            p_competition_id: competition_id,
            p_season_id: season_id,
            p_stage_filter: groupId,
          });

          if (groupStandings) {
            // Save group snapshot
            await adminSupabaseClient.from('phase_snapshots').insert({
              season_id,
              phase_name: groupId,
              snapshot_data: groupStandings,
            });

            // Get top N from group
            for (let i = 0; i < Math.min(advancingPerGroup, groupStandings.length); i++) {
              allAdvancing.push({
                team_id: groupStandings[i].team_id,
                seed: g * advancingPerGroup + i + 1,
              });
            }
          }
        }

        // Generate knockout matches
        newMatches = generateKnockoutMatches(
          allAdvancing,
          'knockout',
          competition_id,
          season_id,
          'seeded'
        );
      }
    }

    // 9. Persist new matches
    if (newMatches.length > 0) {
      const { data: insertedMatches, error: insertError } = await adminSupabaseClient
        .from('matches')
        .insert(newMatches)
        .select();

      if (insertError) throw insertError;
      newMatches = insertedMatches as GeneratedMatch[];
    }

    // 10. Return result
    return new Response(JSON.stringify({
      success: true,
      phase_closed: phaseId,
      next_phase: nextPhase?.id ?? null,
      handler_key: handlerKey,
      matches_generated: newMatches.length,
      matches: newMatches,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in tournament-phase-manager:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
