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
  schedulingMode?: 'classic' | 'event';
  constraints: ScheduleConstraints;
  algorithm?: MatchGenerationType;
  teams?: string[];  // Optional override for specific teams (e.g., group)
  seedingMethod?: 'random' | 'seeded' | 'manual';
  // Event mode fields
  events?: EventDateConfig[];
  duration?: number;       // match duration in minutes
  breakTime?: number;      // break between matches in minutes
  eventConstraints?: EventConstraints;
}

interface EventDateConfig {
  date: string;        // "2026-03-15"
  startTime: string;   // "18:00"
  endTime: string;     // "21:00"
  venueIds: string[];
  teamIds: string[];
}

interface EventConstraints {
  avoidRepeats: boolean;
  balanceMatches: boolean;
  avoidBackToBack: boolean;
  autoReferee: boolean;
  targetMatchesPerTeam?: number;
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
  match_day?: number;
  match_duration_minutes?: number;
  referee_team_id?: string;
}

interface EventSlot {
  match_date: string;
  venue_id: string;
}

interface ScoredPairing {
  home: string;
  away: string;
  score: number;
}

interface ScheduleQualityScore {
  totalScore: number;
  totalMatches: number;
  repeatViolations: number;
  backToBackViolations: number;
  unfilledSlots: number;
  matchImbalanceStdDev: number;
  refereeImbalanceStdDev: number;
}

interface ScheduleAttempt {
  matches: GeneratedMatch[];
  quality: ScheduleQualityScore;
  attemptIndex: number;
}

interface EventModeStats {
  attemptsRun: number;
  bestAttemptIndex: number;
  bestScore: number;
  allAttemptScores: number[];
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
 * Mulberry32 seeded PRNG — deterministic per attempt index.
 * Returns a function producing pseudo-random floats in [0, 1).
 */
function makePRNG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using a provided PRNG (reproducible per attempt seed).
 */
function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
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
// Event Mode Functions
// =============================================================================

/**
 * Generate time slots for a single event based on duration and break time.
 * Each venue gets floor((endTime - startTime) / (duration + breakTime)) slots.
 */
function generateEventSlots(
  event: EventDateConfig,
  duration: number,
  breakTime: number
): EventSlot[] {
  const slots: EventSlot[] = [];
  const [startH, startM] = event.startTime.split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const windowMinutes = endMinutes - startMinutes;
  const slotInterval = duration + breakTime;

  if (slotInterval <= 0 || windowMinutes <= 0) return slots;

  const slotsPerVenue = Math.floor(windowMinutes / slotInterval);

  for (const venueId of event.venueIds) {
    for (let i = 0; i < slotsPerVenue; i++) {
      const slotStartMinutes = startMinutes + i * slotInterval;
      const h = String(Math.floor(slotStartMinutes / 60)).padStart(2, '0');
      const m = String(slotStartMinutes % 60).padStart(2, '0');
      slots.push({
        match_date: `${event.date}T${h}:${m}:00+00:00`,
        venue_id: venueId,
      });
    }
  }

  return slots;
}

/**
 * Generate scored pairings for event mode.
 * All possible combinations of teamIds are generated and scored based on constraints.
 * Uses a seeded PRNG for reproducible results per attempt.
 */
function generateEventPairings(
  teamIds: string[],
  existingMatchups: Map<string, number>,
  teamMatchCounts: Map<string, number>,
  constraints: EventConstraints,
  rng: () => number
): ScoredPairing[] {
  const pairings: ScoredPairing[] = [];

  // Pre-compute max match count for normalized balance bonus
  const maxCount = teamMatchCounts.size > 0
    ? Math.max(...teamMatchCounts.values())
    : 0;

  // Generate all C(n,2) combinations
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const home = teamIds[i];
      const away = teamIds[j];
      const key = [home, away].sort().join('-');
      let score = 100; // base score

      if (constraints.avoidRepeats) {
        const timesPlayed = existingMatchups.get(key) ?? 0;
        // Stronger penalty (-50 per repeat, was -30) so repeats are well-avoided
        score -= timesPlayed * 50;
      }

      if (constraints.balanceMatches) {
        const homeCount = teamMatchCounts.get(home) ?? 0;
        const awayCount = teamMatchCounts.get(away) ?? 0;
        // Normalized bonus: reward teams further below the current max
        const norm = maxCount > 0 ? maxCount : 1;
        const homeBoost = Math.max(0, (norm - homeCount) / norm) * 20;
        const awayBoost = Math.max(0, (norm - awayCount) / norm) * 20;
        score += homeBoost + awayBoost; // up to +40 total (was +20)
      }

      // Tiny jitter (±1) to break ties — won't override real score differences
      score += rng() * 2 - 1;

      pairings.push({ home, away, score });
    }
  }

  // Sort descending by score (best pairings first)
  pairings.sort((a, b) => b.score - a.score);
  return pairings;
}

/**
 * Assign pairings to slots respecting constraints.
 * Returns the final list of assigned matches for one event.
 * Uses seeded PRNG for reproducibility and best-valid (not first-valid) selection.
 */
function assignMatchesToSlots(
  pairings: ScoredPairing[],
  slots: EventSlot[],
  allTeamIds: string[],
  constraints: EventConstraints,
  matchDay: number,
  duration: number,
  competitionId: string,
  seasonId: string,
  stage: string,
  rng: () => number,
  targetMatchesPerTeam?: number
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  const teamMatchCounts = new Map<string, number>();
  const refereeCounts = new Map<string, number>(); // Track referee assignments for balanced distribution

  // Sort slots chronologically for back-to-back detection
  const sortedSlots = [...slots].sort((a, b) => a.match_date.localeCompare(b.match_date));

  // Pre-compute unique time slots once (avoids O(n²) recomputation inside the loop)
  const slotTimes = [...new Set(sortedSlots.map(s => s.match_date))].sort();
  const slotTimeIndex = new Map<string, number>(slotTimes.map((t, i) => [t, i]));

  // Track teams playing at each time slot (across venues)
  const timeSlotTeams = new Map<string, Set<string>>();

  for (const slot of sortedSlots) {
    const currentTimeIdx = slotTimeIndex.get(slot.match_date) ?? -1;
    const prevTime = currentTimeIdx > 0 ? slotTimes[currentTimeIdx - 1] : null;
    const currentTeams = timeSlotTeams.get(slot.match_date);

    // --- BEST-VALID selection: scan all pairings, pick highest score among valid ---
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < pairings.length; i++) {
      const p = pairings[i];

      // Hard constraint: target matches per team cap
      if (targetMatchesPerTeam) {
        if ((teamMatchCounts.get(p.home) ?? 0) >= targetMatchesPerTeam) continue;
        if ((teamMatchCounts.get(p.away) ?? 0) >= targetMatchesPerTeam) continue;
      }

      // Hard constraint: avoidBackToBack — skip if either team played previous slot
      if (constraints.avoidBackToBack && prevTime) {
        const prevTeams = timeSlotTeams.get(prevTime);
        if (prevTeams && (prevTeams.has(p.home) || prevTeams.has(p.away))) {
          continue;
        }
      }

      // Hard constraint: team can't play twice at the same time (parallel venues)
      if (currentTeams && (currentTeams.has(p.home) || currentTeams.has(p.away))) {
        continue;
      }

      // Valid candidate — select the one with highest score
      if (p.score > bestScore) {
        bestScore = p.score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) continue; // No valid pairing for this slot

    const pairing = pairings.splice(bestIdx, 1)[0];

    // Track team usage
    teamMatchCounts.set(pairing.home, (teamMatchCounts.get(pairing.home) ?? 0) + 1);
    teamMatchCounts.set(pairing.away, (teamMatchCounts.get(pairing.away) ?? 0) + 1);

    // Track time slot usage
    if (!timeSlotTeams.has(slot.match_date)) {
      timeSlotTeams.set(slot.match_date, new Set());
    }
    timeSlotTeams.get(slot.match_date)!.add(pairing.home);
    timeSlotTeams.get(slot.match_date)!.add(pairing.away);

    // Auto-referee: pick the available team that has refereed the least (balanced)
    let refereeTeamId: string | undefined;
    if (constraints.autoReferee) {
      const busyTeams = timeSlotTeams.get(slot.match_date)!;
      const available = allTeamIds.filter(t => !busyTeams.has(t));
      if (available.length > 0) {
        let minRefCount = Infinity;
        for (const t of available) {
          const count = refereeCounts.get(t) ?? 0;
          if (count < minRefCount) minRefCount = count;
        }
        const candidates = available.filter(t => (refereeCounts.get(t) ?? 0) === minRefCount);
        refereeTeamId = candidates[Math.floor(rng() * candidates.length)];
        refereeCounts.set(refereeTeamId, (refereeCounts.get(refereeTeamId) ?? 0) + 1);
      }
    }

    matches.push({
      home_team_id: pairing.home,
      away_team_id: pairing.away,
      match_date: slot.match_date,
      venue_id: slot.venue_id,
      competition_id: competitionId,
      season_id: seasonId,
      stage,
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      match_day: matchDay,
      match_duration_minutes: duration,
      ...(refereeTeamId ? { referee_team_id: refereeTeamId } : {}),
    });
  }

  return matches;
}

// =============================================================================
// Event Mode Quality Scoring & Multi-Attempt Orchestration
// =============================================================================

/**
 * Compute a composite quality score for a complete event-mode schedule.
 * Higher is better. Used to select the best attempt from N runs.
 */
function scoreScheduleQuality(
  matches: GeneratedMatch[],
  totalSlots: number,
  constraints: EventConstraints,
  existingMatchupsSnapshot: Map<string, number>
): ScheduleQualityScore {
  const totalMatches = matches.length;
  let totalScore = totalMatches * 10; // +10 per match scheduled (primary metric)

  // Unfilled slots penalty
  const unfilledSlots = totalSlots - totalMatches;
  totalScore -= unfilledSlots * 20;

  // Repeat violations
  let repeatViolations = 0;
  if (constraints.avoidRepeats) {
    for (const m of matches) {
      const key = [m.home_team_id, m.away_team_id].sort().join('-');
      const prior = existingMatchupsSnapshot.get(key) ?? 0;
      if (prior > 0) repeatViolations++;
    }
    totalScore -= repeatViolations * 50;
  }

  // Back-to-back violations
  let backToBackViolations = 0;
  if (constraints.avoidBackToBack && matches.length > 0) {
    // Group matches by day
    const byDay = new Map<string, GeneratedMatch[]>();
    for (const m of matches) {
      const day = m.match_date.split('T')[0];
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(m);
    }
    for (const dayMatches of byDay.values()) {
      const times = [...new Set(dayMatches.map(m => m.match_date))].sort();
      const timeIdx = new Map<string, number>(times.map((t, i) => [t, i]));
      const timeTeams = new Map<string, Set<string>>();
      for (const m of dayMatches) {
        if (!timeTeams.has(m.match_date)) timeTeams.set(m.match_date, new Set());
        timeTeams.get(m.match_date)!.add(m.home_team_id);
        timeTeams.get(m.match_date)!.add(m.away_team_id);
      }
      for (const m of dayMatches) {
        const idx = timeIdx.get(m.match_date) ?? -1;
        if (idx > 0) {
          const prevTeams = timeTeams.get(times[idx - 1]);
          if (prevTeams && (prevTeams.has(m.home_team_id) || prevTeams.has(m.away_team_id))) {
            backToBackViolations++;
          }
        }
      }
    }
    // Divide by 2: each violation counted once per team in a match pair
    backToBackViolations = Math.floor(backToBackViolations / 2);
    totalScore -= backToBackViolations * 30;
  }

  // Match count imbalance (std deviation across teams)
  const teamCounts = new Map<string, number>();
  for (const m of matches) {
    teamCounts.set(m.home_team_id, (teamCounts.get(m.home_team_id) ?? 0) + 1);
    teamCounts.set(m.away_team_id, (teamCounts.get(m.away_team_id) ?? 0) + 1);
  }
  let matchImbalanceStdDev = 0;
  if (teamCounts.size > 1) {
    const counts = [...teamCounts.values()];
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
    matchImbalanceStdDev = Math.sqrt(variance);
    totalScore -= matchImbalanceStdDev * 5;
  }

  // Referee count imbalance (only when autoReferee is active)
  let refereeImbalanceStdDev = 0;
  if (constraints.autoReferee) {
    const refCounts = new Map<string, number>();
    for (const m of matches) {
      if (m.referee_team_id) {
        refCounts.set(m.referee_team_id, (refCounts.get(m.referee_team_id) ?? 0) + 1);
      }
    }
    if (refCounts.size > 1) {
      const counts = [...refCounts.values()];
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
      refereeImbalanceStdDev = Math.sqrt(variance);
      totalScore -= refereeImbalanceStdDev * 5;
    }
  }

  return {
    totalScore,
    totalMatches,
    repeatViolations,
    backToBackViolations,
    unfilledSlots,
    matchImbalanceStdDev,
    refereeImbalanceStdDev,
  };
}

/** Number of scheduling attempts to run in event mode. Best result is returned. */
const EVENT_MODE_ATTEMPTS = 8;

/**
 * Run event mode scheduling N times with different random seeds.
 * Returns the attempt with the highest quality score.
 */
function runEventModeMultiAttempt(
  eventConfigs: EventDateConfig[],
  duration: number,
  breakTime: number,
  ec: EventConstraints,
  existingMatchupsSnapshot: Map<string, number>,
  globalTeamMatchCountsSnapshot: Map<string, number>,
  competitionId: string,
  seasonId: string,
  stage: string,
  attemptCount: number = EVENT_MODE_ATTEMPTS
): { bestAttempt: ScheduleAttempt; stats: EventModeStats } {
  // Pre-compute total slots across all events (for quality scoring)
  const totalSlots = eventConfigs.reduce((sum, event) => {
    return sum + generateEventSlots(event, duration, breakTime).length;
  }, 0);

  // Perfect score: all slots filled, no violations
  const perfectScore = totalSlots * 10;

  const attempts: ScheduleAttempt[] = [];

  for (let a = 0; a < attemptCount; a++) {
    // Deterministic seed per attempt — large prime spacing to avoid collisions
    const seed = (Date.now() + a * 1000003) >>> 0;
    const rng = makePRNG(seed);

    // Deep-clone Maps so each attempt starts from the same pre-generation state
    const attemptMatchups = new Map(existingMatchupsSnapshot);
    const attemptTeamCounts = new Map(globalTeamMatchCountsSnapshot);
    const allMatches: GeneratedMatch[] = [];
    let matchDay = 1;

    for (const event of eventConfigs) {
      // Shuffle team list per attempt for pairing diversity
      const shuffledTeamIds = seededShuffle(event.teamIds, rng);

      const slots = generateEventSlots(event, duration, breakTime);

      const pairings = generateEventPairings(
        shuffledTeamIds,
        attemptMatchups,
        attemptTeamCounts,
        ec,
        rng
      );

      const eventMatches = assignMatchesToSlots(
        pairings,
        slots,
        event.teamIds,
        ec,
        matchDay,
        duration,
        competitionId,
        seasonId,
        stage,
        rng,
        ec.targetMatchesPerTeam
      );

      // Update running state for subsequent events within this attempt
      for (const m of eventMatches) {
        const key = [m.home_team_id, m.away_team_id].sort().join('-');
        attemptMatchups.set(key, (attemptMatchups.get(key) ?? 0) + 1);
        attemptTeamCounts.set(m.home_team_id, (attemptTeamCounts.get(m.home_team_id) ?? 0) + 1);
        attemptTeamCounts.set(m.away_team_id, (attemptTeamCounts.get(m.away_team_id) ?? 0) + 1);
      }

      allMatches.push(...eventMatches);
      matchDay++;
    }

    const quality = scoreScheduleQuality(
      allMatches,
      totalSlots,
      ec,
      existingMatchupsSnapshot // use original snapshot (pre-generation baseline)
    );

    attempts.push({ matches: allMatches, quality, attemptIndex: a });

    // Early exit: if schedule is perfect, no need to run more attempts
    if (quality.totalScore >= perfectScore) break;
  }

  // Select the attempt with the highest quality score
  const bestAttempt = attempts.reduce((best, curr) =>
    curr.quality.totalScore > best.quality.totalScore ? curr : best
  );

  const stats: EventModeStats = {
    attemptsRun: attempts.length,
    bestAttemptIndex: bestAttempt.attemptIndex,
    bestScore: bestAttempt.quality.totalScore,
    allAttemptScores: attempts.map(a => a.quality.totalScore),
  };

  return { bestAttempt, stats };
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
      schedulingMode,
      constraints,
      algorithm: explicitAlgorithm,
      teams: overrideTeamIds,
      seedingMethod,
      events: eventConfigs,
      duration: eventDuration,
      breakTime: eventBreakTime,
      eventConstraints,
    } = schedule as ScheduleRequest;

    // =========================================================================
    // EVENT MODE
    // =========================================================================
    if (schedulingMode === 'event') {
      if (!season_id || !stage) {
        return new Response(JSON.stringify({
          error: 'season_id and stage are required.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!eventConfigs || eventConfigs.length === 0) {
        return new Response(JSON.stringify({
          error: 'At least one event is required for event mode.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const duration = eventDuration ?? 15;
      const breakTime = eventBreakTime ?? 5;
      const ec: EventConstraints = eventConstraints ?? {
        avoidRepeats: false,
        balanceMatches: false,
        avoidBackToBack: false,
        autoReferee: false,
      };

      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Load season to get competition_id
      const { data: seasonData, error: seasonError } = await adminClient
        .from('seasons')
        .select('*, competitions(id)')
        .eq('id', season_id)
        .single();

      if (seasonError) throw seasonError;

      const competition_id = (seasonData as any).competitions?.id;
      if (!competition_id) {
        throw new Error('Competition ID not found for the given season.');
      }

      // Load existing matches for avoidRepeats / balanceMatches
      const existingMatchups = new Map<string, number>();
      const globalTeamMatchCounts = new Map<string, number>();

      if (ec.avoidRepeats || ec.balanceMatches) {
        const { data: existingMatches } = await adminClient
          .from('matches')
          .select('home_team_id, away_team_id')
          .eq('season_id', season_id);

        if (existingMatches) {
          for (const m of existingMatches) {
            const key = [m.home_team_id, m.away_team_id].sort().join('-');
            existingMatchups.set(key, (existingMatchups.get(key) ?? 0) + 1);
            globalTeamMatchCounts.set(m.home_team_id, (globalTeamMatchCounts.get(m.home_team_id) ?? 0) + 1);
            globalTeamMatchCounts.set(m.away_team_id, (globalTeamMatchCounts.get(m.away_team_id) ?? 0) + 1);
          }
        }
      }

      // Validate events upfront before running multi-attempt
      for (const event of eventConfigs) {
        if (!event.teamIds || event.teamIds.length < 2) {
          throw new Error(`Event on ${event.date} must have at least 2 teams.`);
        }
        if (!event.venueIds || event.venueIds.length === 0) {
          throw new Error(`Event on ${event.date} must have at least 1 venue.`);
        }
        const testSlots = generateEventSlots(event, duration, breakTime);
        if (testSlots.length === 0) {
          throw new Error(`Event on ${event.date}: time window too short for duration ${duration}min + break ${breakTime}min.`);
        }
      }

      // Run multi-attempt scheduling — returns best of N schedules
      const { bestAttempt, stats } = runEventModeMultiAttempt(
        eventConfigs,
        duration,
        breakTime,
        ec,
        existingMatchups,        // snapshot before generation
        globalTeamMatchCounts,   // snapshot before generation
        competition_id,
        season_id,
        stage
      );

      return new Response(JSON.stringify({
        success: true,
        schedulingMode: 'event',
        total_matches: bestAttempt.matches.length,
        matches: bestAttempt.matches,
        generation_stats: {
          attemptsRun: stats.attemptsRun,
          bestAttemptIndex: stats.bestAttemptIndex,
          bestScore: stats.bestScore,
          allAttemptScores: stats.allAttemptScores,
          quality: bestAttempt.quality,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // CLASSIC MODE (unchanged)
    // =========================================================================
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
    // In classic scheduling mode (from Schedule Generator), always use round_robin
    // to generate all matches upfront, regardless of tournament mode configuration
    let algorithm = determineAlgorithm(stage, handlerKey, explicitAlgorithm);

    // Classic mode from Schedule Generator should always use round_robin for full season generation
    // Swiss/knockout modes are for round-by-round generation, not bulk scheduling
    if (schedulingMode === undefined || schedulingMode === 'classic') {
      if (algorithm === 'swiss_pairing') {
        algorithm = 'round_robin';
        console.log('Classic mode: overriding swiss_pairing with round_robin for full season generation');
      }
    }

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
