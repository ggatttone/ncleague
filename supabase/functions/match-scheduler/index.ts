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
type MatchGenerationType = 'round_robin' | 'knockout' | 'swiss_pairing' | 'group_assignment';

interface ScheduleConstraints {
  startDate: string;
  endDate: string;
  allowedDays: number[]; // 0=Sun, 1=Mon...
  timeSlots: string[];   // ["18:00", "20:00"]
  venueIds: string[];
  includeReturnGames?: boolean;
}

interface ScheduleRequest {
  season_id: string;
  stage: string;
  constraints: ScheduleConstraints;
  algorithm?: MatchGenerationType;
  teams?: string[];  // Optional override for specific teams (e.g., group)
  seedingMethod?: 'random' | 'seeded' | 'manual';
}

interface GeneratedMatch {
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue_id: string;
  status: string;
  stage: string;
  home_score: number;
  away_score: number;
}

interface TournamentMode {
  id: string;
  name: string;
  handler_key: TournamentHandlerKey;
  settings: Record<string, unknown>;
}

// =============================================================================
// Auth Helper
// =============================================================================
async function isUserAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError?.message);
    return false;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profile error:', profileError?.message);
    return false;
  }

  return profile.role === 'admin';
}

// =============================================================================
// Match Generation Algorithms
// =============================================================================

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
 * Generate round-robin pairings using circle method
 */
function generateRoundRobinPairings(
  teams: { id: string }[],
  includeReturnGames: boolean
): Array<{ home_team_id: string; away_team_id: string; round: number }> {
  const pairings: Array<{ home_team_id: string; away_team_id: string; round: number }> = [];
  const teamList = [...teams];

  if (teamList.length % 2 !== 0) {
    teamList.push({ id: 'BYE' });
  }

  const numRounds = teamList.length - 1;
  const half = teamList.length / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const home = teamList[i];
      const away = teamList[teamList.length - 1 - i];
      if (home.id !== 'BYE' && away.id !== 'BYE') {
        pairings.push({
          home_team_id: home.id,
          away_team_id: away.id,
          round: round + 1,
        });
      }
    }
    const last = teamList.pop();
    if (last) {
      teamList.splice(1, 0, last);
    }
  }

  if (includeReturnGames) {
    const returnPairings = pairings.map(p => ({
      home_team_id: p.away_team_id,
      away_team_id: p.home_team_id,
      round: p.round + numRounds,
    }));
    return [...pairings, ...returnPairings];
  }

  return pairings;
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
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Arrange teams in standard bracket order for seeded tournament
 */
function arrangeBracketSeeding(teams: { id: string; seed?: number }[]): { id: string; seed?: number }[] {
  const n = teams.length;
  const positions = getBracketPositions(n);
  const arranged: { id: string; seed?: number }[] = new Array(n);

  // Sort by seed if available
  const sorted = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  for (let i = 0; i < n; i++) {
    arranged[positions[i]] = sorted[i];
  }

  return arranged;
}

/**
 * Generate knockout bracket pairings
 */
function generateKnockoutPairings(
  teams: { id: string; seed?: number }[],
  seedingMethod: 'random' | 'seeded' | 'manual' = 'seeded'
): Array<{ home_team_id: string; away_team_id: string; bracketPosition: number }> {
  const pairings: Array<{ home_team_id: string; away_team_id: string; bracketPosition: number }> = [];

  let orderedTeams = [...teams];

  switch (seedingMethod) {
    case 'random':
      orderedTeams = shuffleArray(orderedTeams);
      break;
    case 'seeded':
      orderedTeams = arrangeBracketSeeding(orderedTeams);
      break;
    case 'manual':
      // Use teams in provided order
      break;
  }

  for (let i = 0; i < orderedTeams.length; i += 2) {
    if (i + 1 < orderedTeams.length) {
      pairings.push({
        home_team_id: orderedTeams[i].id,
        away_team_id: orderedTeams[i + 1].id,
        bracketPosition: Math.floor(i / 2),
      });
    }
  }

  return pairings;
}

/**
 * Generate group assignments (serpentine distribution)
 */
function generateGroupAssignments(
  teams: { id: string; seed?: number }[],
  groupCount: number
): Map<string, { id: string; seed?: number }[]> {
  const groups = new Map<string, { id: string; seed?: number }[]>();

  // Initialize groups
  for (let g = 0; g < groupCount; g++) {
    const groupKey = `group_${String.fromCharCode(97 + g)}`; // group_a, group_b, etc.
    groups.set(groupKey, []);
  }

  // Sort teams by seed (if available)
  const sortedTeams = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  // Serpentine distribution
  let groupIndex = 0;
  let direction = 1; // 1 = forward, -1 = backward

  for (const team of sortedTeams) {
    const groupKey = `group_${String.fromCharCode(97 + groupIndex)}`;
    groups.get(groupKey)?.push(team);

    // Move to next group (serpentine pattern)
    groupIndex += direction;

    // Reverse direction at boundaries
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
 * Generate slots based on scheduling constraints
 */
function generateSlots(constraints: ScheduleConstraints): { match_date: string; venue_id: string }[] {
  const slots: { match_date: string; venue_id: string }[] = [];
  const { startDate, endDate, allowedDays, timeSlots, venueIds } = constraints;

  // Parse dates as plain strings to avoid timezone issues
  const [startY, startM, startD] = startDate.split('-').map(Number);
  const [endY, endM, endD] = endDate.split('-').map(Number);

  // Use UTC methods throughout to prevent local timezone offset
  const currentDate = new Date(Date.UTC(startY, startM - 1, startD));
  const finalDate = new Date(Date.UTC(endY, endM - 1, endD));

  while (currentDate <= finalDate) {
    if (allowedDays.includes(currentDate.getUTCDay())) {
      for (const time of timeSlots) {
        for (const venueId of venueIds) {
          const [hours, minutes] = time.split(':').map(Number);
          // Build ISO string directly to avoid any timezone conversion
          const y = currentDate.getUTCFullYear();
          const m = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
          const d = String(currentDate.getUTCDate()).padStart(2, '0');
          const h = String(hours).padStart(2, '0');
          const min = String(minutes).padStart(2, '0');
          slots.push({
            match_date: `${y}-${m}-${d}T${h}:${min}:00+00:00`,
            venue_id: venueId,
          });
        }
      }
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return slots;
}

/**
 * Determine algorithm based on stage and handler
 */
function determineAlgorithm(
  stage: string,
  handlerKey: TournamentHandlerKey,
  explicitAlgorithm?: MatchGenerationType
): MatchGenerationType {
  // Use explicit algorithm if provided
  if (explicitAlgorithm) {
    return explicitAlgorithm;
  }

  // Infer from stage name
  if (stage.startsWith('group_')) {
    return 'round_robin';
  }

  if (['final', 'semi-final', 'quarter-final', 'round-of-16', 'round-of-32', 'knockout', 'third-place_playoff'].includes(stage)) {
    return 'knockout';
  }

  // Infer from handler
  switch (handlerKey) {
    case 'knockout':
      return 'knockout';
    case 'swiss_system':
      return stage === 'regular_season' ? 'swiss_pairing' : 'round_robin';
    case 'groups_knockout':
      return stage === 'group_stage' ? 'round_robin' : 'knockout';
    default:
      return 'round_robin';
  }
}

/**
 * Normalize handler key for backwards compatibility
 */
function normalizeHandlerKey(key: string): TournamentHandlerKey {
  const legacyMap: Record<string, TournamentHandlerKey> = {
    generate_playoffs: 'swiss_system',
    default: 'league_only',
  };

  const validKeys: TournamentHandlerKey[] = ['league_only', 'knockout', 'groups_knockout', 'swiss_system', 'round_robin_final'];

  if (validKeys.includes(key as TournamentHandlerKey)) {
    return key as TournamentHandlerKey;
  }

  return legacyMap[key] ?? 'league_only';
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
      return new Response(JSON.stringify({ error: 'Access denied.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request
    const { dryRun, schedule } = await req.json();

    // 3. If not dry run, just save the provided schedule
    if (!dryRun) {
      const adminSupabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data, error } = await adminSupabaseClient
        .from('matches')
        .insert(schedule)
        .select();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Dry run - generate schedule
    const {
      season_id,
      stage,
      constraints,
      algorithm: explicitAlgorithm,
      teams: overrideTeamIds,
      seedingMethod,
    } = schedule as ScheduleRequest;

    if (!season_id || !stage || !constraints) {
      return new Response(JSON.stringify({
        error: 'season_id, stage, and constraints are required for a dry run.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Load season with tournament mode
    const { data: seasonData, error: seasonError } = await adminSupabaseClient
      .from('seasons')
      .select('*, competitions(id), tournament_modes(id, name, handler_key, settings), season_teams(teams(id, name))')
      .eq('id', season_id)
      .single();

    if (seasonError) throw seasonError;

    const competition_id = (seasonData as any).competitions?.id;
    if (!competition_id) {
      throw new Error('Competition ID not found for the given season.');
    }

    // 6. Get tournament mode settings
    const tournamentMode = (seasonData as any).tournament_modes as TournamentMode | null;
    const handlerKey = normalizeHandlerKey(tournamentMode?.handler_key ?? 'league_only');
    const modeSettings = tournamentMode?.settings ?? {};

    // 7. Get teams
    let teams: { id: string; seed?: number }[];

    if (overrideTeamIds && overrideTeamIds.length > 0) {
      // Use provided team IDs
      teams = overrideTeamIds.map((id: string, idx: number) => ({ id, seed: idx + 1 }));
    } else {
      // Get from season_teams
      const seasonTeams = (seasonData as any).season_teams || [];
      teams = seasonTeams.map((st: any, idx: number) => ({
        id: st.teams?.id,
        name: st.teams?.name,
        seed: idx + 1,
      })).filter((t: any) => t.id);
    }

    if (teams.length < 2) {
      throw new Error('Not enough teams in the season.');
    }

    // 8. Determine algorithm to use
    const algorithm = determineAlgorithm(stage, handlerKey, explicitAlgorithm);

    console.log(`Generating schedule: stage=${stage}, algorithm=${algorithm}, handler=${handlerKey}, teams=${teams.length}`);

    // 9. Generate pairings based on algorithm
    let pairings: Array<{ home_team_id: string; away_team_id: string; round?: number; bracketPosition?: number }> = [];

    switch (algorithm) {
      case 'round_robin': {
        const rrPairings = generateRoundRobinPairings(
          teams,
          constraints.includeReturnGames ?? (modeSettings.doubleRoundRobin as boolean) ?? false
        );
        pairings = rrPairings;
        break;
      }

      case 'knockout': {
        const koPairings = generateKnockoutPairings(
          teams,
          seedingMethod ?? (modeSettings.seedingMethod as 'random' | 'seeded' | 'manual') ?? 'seeded'
        );
        pairings = koPairings;
        break;
      }

      case 'swiss_pairing': {
        // Swiss: pair adjacent teams by seed/standing
        const shuffled = shuffleArray(teams);
        for (let i = 0; i < shuffled.length; i += 2) {
          if (shuffled[i + 1]) {
            pairings.push({
              home_team_id: shuffled[i].id,
              away_team_id: shuffled[i + 1].id,
              round: 1,
            });
          }
        }
        break;
      }

      case 'group_assignment': {
        // Generate matches for all groups
        const groupCount = (modeSettings.groupCount as number) ?? 4;
        const groups = generateGroupAssignments(teams, groupCount);

        for (const [groupKey, groupTeams] of groups.entries()) {
          const groupPairings = generateRoundRobinPairings(
            groupTeams,
            (modeSettings.doubleRoundRobin as boolean) ?? false
          );
          // Tag pairings with group stage
          pairings.push(...groupPairings.map(p => ({
            ...p,
            // Store group info for later use if needed
          })));
        }
        break;
      }

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    // 10. Generate time slots
    const slots = generateSlots(constraints);

    if (pairings.length > slots.length) {
      throw new Error(`Not enough available slots (${slots.length}) to schedule all matches (${pairings.length}).`);
    }

    // 11. Create match objects
    const generatedMatches: GeneratedMatch[] = pairings.map((pairing, index) => ({
      home_team_id: pairing.home_team_id,
      away_team_id: pairing.away_team_id,
      match_date: slots[index].match_date,
      venue_id: slots[index].venue_id,
      competition_id,
      season_id,
      stage,
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
    }));

    // 12. Return generated schedule
    return new Response(JSON.stringify({
      success: true,
      algorithm,
      handler_key: handlerKey,
      total_matches: generatedMatches.length,
      matches: generatedMatches,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in match-scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
