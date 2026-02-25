/**
 * Standalone test script for the event-mode scheduling algorithm.
 * Replicates the pure algorithm functions from index.ts (no Deno/Supabase dependencies).
 *
 * Run with: npx tsx supabase/functions/match-scheduler/test-scheduler.ts
 */

// =============================================================================
// Types (copied from index.ts)
// =============================================================================
interface EventDateConfig {
  date: string;
  startTime: string;
  endTime: string;
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
  repeatTier: number;
}

interface SharedEventState {
  timeSlotTeams: Map<string, Set<string>>;
  refereeCounts: Map<string, number>;
  teamMatchCounts: Map<string, number>;
  matchupCounts: Map<string, number>;
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

// =============================================================================
// Algorithm functions (copied from index.ts)
// =============================================================================

function makePRNG(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateEventSlots(event: EventDateConfig, duration: number, breakTime: number): EventSlot[] {
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
      slots.push({ match_date: `${event.date}T${h}:${m}:00+00:00`, venue_id: venueId });
    }
  }
  return slots;
}

function generateEventPairings(
  teamIds: string[],
  sharedState: SharedEventState,
  constraints: EventConstraints,
  rng: () => number
): ScoredPairing[] {
  const pairings: ScoredPairing[] = [];
  const allCounts = [...sharedState.teamMatchCounts.values()];
  const maxCount = allCounts.length > 0 ? Math.max(...allCounts) : 0;

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const home = teamIds[i];
      const away = teamIds[j];
      const key = [home, away].sort().join('-');
      const timesPlayed = sharedState.matchupCounts.get(key) ?? 0;
      const repeatTier = constraints.avoidRepeats ? timesPlayed : 0;
      let score = 1000;
      if (constraints.balanceMatches) {
        const homeCount = sharedState.teamMatchCounts.get(home) ?? 0;
        const awayCount = sharedState.teamMatchCounts.get(away) ?? 0;
        const homeDeficit = Math.max(0, maxCount - homeCount);
        const awayDeficit = Math.max(0, maxCount - awayCount);
        score += (homeDeficit + awayDeficit) * 100;
      }
      score += rng() * 2 - 1;
      pairings.push({ home, away, score, repeatTier });
    }
  }
  pairings.sort((a, b) => {
    if (a.repeatTier !== b.repeatTier) return a.repeatTier - b.repeatTier;
    return b.score - a.score;
  });
  return pairings;
}

/** Minimum gap in time slots when avoidBackToBack is ON */
const BACK_TO_BACK_GAP = 2;

function assignMatchesToSlots(
  pairings: ScoredPairing[],
  slots: EventSlot[],
  _allTeamIds: string[],
  constraints: EventConstraints,
  matchDay: number,
  duration: number,
  competitionId: string,
  seasonId: string,
  stage: string,
  _rng: () => number,
  sharedState: SharedEventState,
  targetMatchesPerTeam?: number
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  const sortedSlots = [...slots].sort((a, b) => a.match_date.localeCompare(b.match_date));

  const allKnownTimes = new Set([
    ...sharedState.timeSlotTeams.keys(),
    ...sortedSlots.map(s => s.match_date),
  ]);
  const allTimeSorted = [...allKnownTimes].sort();
  const globalTimeIndex = new Map<string, number>(allTimeSorted.map((t, i) => [t, i]));
  const remainingPairings = [...pairings];

  for (const slot of sortedSlots) {
    const currentTimeIdx = globalTimeIndex.get(slot.match_date) ?? -1;
    const currentTeams = sharedState.timeSlotTeams.get(slot.match_date);

    let bestIdx = -1;
    let bestScore = -Infinity;
    let bestTier = Infinity;

    for (let i = 0; i < remainingPairings.length; i++) {
      const p = remainingPairings[i];

      if (targetMatchesPerTeam) {
        if ((sharedState.teamMatchCounts.get(p.home) ?? 0) >= targetMatchesPerTeam) continue;
        if ((sharedState.teamMatchCounts.get(p.away) ?? 0) >= targetMatchesPerTeam) continue;
      }

      if (constraints.avoidBackToBack) {
        let blocked = false;
        for (let lookback = 1; lookback <= BACK_TO_BACK_GAP; lookback++) {
          const prevIdx = currentTimeIdx - lookback;
          if (prevIdx >= 0) {
            const prevTeams = sharedState.timeSlotTeams.get(allTimeSorted[prevIdx]);
            if (prevTeams && (prevTeams.has(p.home) || prevTeams.has(p.away))) {
              blocked = true;
              break;
            }
          }
        }
        if (blocked) continue;
      }

      if (currentTeams && (currentTeams.has(p.home) || currentTeams.has(p.away))) continue;

      if (p.repeatTier < bestTier || (p.repeatTier === bestTier && p.score > bestScore)) {
        bestScore = p.score;
        bestTier = p.repeatTier;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) continue;

    const pairing = remainingPairings.splice(bestIdx, 1)[0];

    sharedState.teamMatchCounts.set(pairing.home, (sharedState.teamMatchCounts.get(pairing.home) ?? 0) + 1);
    sharedState.teamMatchCounts.set(pairing.away, (sharedState.teamMatchCounts.get(pairing.away) ?? 0) + 1);

    const matchupKey = [pairing.home, pairing.away].sort().join('-');
    sharedState.matchupCounts.set(matchupKey, (sharedState.matchupCounts.get(matchupKey) ?? 0) + 1);

    if (!sharedState.timeSlotTeams.has(slot.match_date)) {
      sharedState.timeSlotTeams.set(slot.match_date, new Set());
    }
    sharedState.timeSlotTeams.get(slot.match_date)!.add(pairing.home);
    sharedState.timeSlotTeams.get(slot.match_date)!.add(pairing.away);

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
    });
  }
  return matches;
}

function assignReferees(
  matches: GeneratedMatch[],
  allTeamIds: string[],
  sharedState: SharedEventState,
  rng: () => number
): void {
  const matchesByTime = new Map<string, GeneratedMatch[]>();
  for (const m of matches) {
    if (!matchesByTime.has(m.match_date)) matchesByTime.set(m.match_date, []);
    matchesByTime.get(m.match_date)!.push(m);
  }

  const sortedTimes = [...matchesByTime.keys()].sort();
  for (const time of sortedTimes) {
    const timeMatches = matchesByTime.get(time)!;
    const busyTeams = new Set<string>();
    for (const m of timeMatches) {
      busyTeams.add(m.home_team_id);
      busyTeams.add(m.away_team_id);
    }
    for (const m of timeMatches) {
      const available = allTeamIds.filter(t => !busyTeams.has(t));
      if (available.length === 0) continue;
      let minRefCount = Infinity;
      for (const t of available) {
        const count = sharedState.refereeCounts.get(t) ?? 0;
        if (count < minRefCount) minRefCount = count;
      }
      const candidates = available.filter(t => (sharedState.refereeCounts.get(t) ?? 0) === minRefCount);
      const chosen = candidates[Math.floor(rng() * candidates.length)];
      m.referee_team_id = chosen;
      sharedState.refereeCounts.set(chosen, (sharedState.refereeCounts.get(chosen) ?? 0) + 1);
      busyTeams.add(chosen);
    }
  }
}

function scoreScheduleQuality(
  matches: GeneratedMatch[],
  totalSlots: number,
  constraints: EventConstraints,
  preExistingMatchups: Map<string, number>,
  slotIntervalMinutes: number = 15
): ScheduleQualityScore {
  const totalMatches = matches.length;
  let totalScore = totalMatches * 10;
  const unfilledSlots = totalSlots - totalMatches;
  totalScore -= unfilledSlots * 20;

  let repeatViolations = 0;
  if (constraints.avoidRepeats) {
    const generatedMatchups = new Map<string, number>();
    for (const m of matches) {
      const key = [m.home_team_id, m.away_team_id].sort().join('-');
      generatedMatchups.set(key, (generatedMatchups.get(key) ?? 0) + 1);
    }
    for (const [key, count] of generatedMatchups) {
      const priorCount = preExistingMatchups.get(key) ?? 0;
      if (priorCount > 0) repeatViolations += count;
      if (count > 1) repeatViolations += (count - 1);
    }
    totalScore -= repeatViolations * 100;
  }

  let backToBackViolations = 0;
  if (constraints.avoidBackToBack && matches.length > 0) {
    const gapThresholdMinutes = BACK_TO_BACK_GAP * slotIntervalMinutes;
    const parseMinutes = (iso: string): number => {
      const timePart = iso.split('T')[1];
      const [h, m] = timePart.split(':').map(Number);
      return h * 60 + m;
    };
    const teamTimes = new Map<string, Array<{ day: string; minutes: number }>>();
    for (const m of matches) {
      const day = m.match_date.split('T')[0];
      const minutes = parseMinutes(m.match_date);
      for (const teamId of [m.home_team_id, m.away_team_id]) {
        if (!teamTimes.has(teamId)) teamTimes.set(teamId, []);
        teamTimes.get(teamId)!.push({ day, minutes });
      }
    }
    const violationSet = new Set<string>();
    for (const [teamId, times] of teamTimes) {
      times.sort((a, b) => a.day.localeCompare(b.day) || a.minutes - b.minutes);
      for (let i = 0; i < times.length - 1; i++) {
        if (times[i].day === times[i + 1].day) {
          const gap = times[i + 1].minutes - times[i].minutes;
          if (gap <= gapThresholdMinutes) {
            const violKey = `${teamId}-${times[i].minutes}-${times[i + 1].minutes}-${times[i].day}`;
            violationSet.add(violKey);
          }
        }
      }
    }
    backToBackViolations = violationSet.size;
    totalScore -= backToBackViolations * 30;
  }

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
    totalScore -= matchImbalanceStdDev * 15;
  }

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
      totalScore -= refereeImbalanceStdDev * 10;
    }
  }

  return { totalScore, totalMatches, repeatViolations, backToBackViolations, unfilledSlots, matchImbalanceStdDev, refereeImbalanceStdDev };
}

const EVENT_MODE_ATTEMPTS = 24;

function runEventModeMultiAttempt(
  eventConfigs: EventDateConfig[],
  duration: number,
  breakTime: number,
  ec: EventConstraints,
  existingMatchupsSnapshot: Map<string, number>,
  globalTeamMatchCountsSnapshot: Map<string, number>,
  competitionId: string,
  seasonId: string,
  stage: string
): { bestAttempt: ScheduleAttempt; stats: EventModeStats } {
  const totalSlots = eventConfigs.reduce((sum, event) => {
    return sum + generateEventSlots(event, duration, breakTime).length;
  }, 0);
  const perfectScore = totalSlots * 10;
  const attempts: ScheduleAttempt[] = [];
  let consecutiveSameScore = 0;
  let lastScore: number | null = null;

  for (let a = 0; a < EVENT_MODE_ATTEMPTS; a++) {
    const seed = (Date.now() + a * 1000003) >>> 0;
    const rng = makePRNG(seed);

    const sharedState: SharedEventState = {
      timeSlotTeams: new Map(),
      refereeCounts: new Map(),
      teamMatchCounts: new Map(globalTeamMatchCountsSnapshot),
      matchupCounts: new Map(existingMatchupsSnapshot),
    };

    const allMatches: GeneratedMatch[] = [];
    let matchDay = 1;

    for (const event of eventConfigs) {
      const shuffledTeamIds = seededShuffle(event.teamIds, rng);
      const slots = generateEventSlots(event, duration, breakTime);
      const pairings = generateEventPairings(shuffledTeamIds, sharedState, ec, rng);
      const eventMatches = assignMatchesToSlots(
        pairings, slots, event.teamIds, ec, matchDay, duration,
        competitionId, seasonId, stage, rng, sharedState, ec.targetMatchesPerTeam
      );
      if (ec.autoReferee) {
        assignReferees(eventMatches, event.teamIds, sharedState, rng);
      }
      allMatches.push(...eventMatches);
      matchDay++;
    }

    const quality = scoreScheduleQuality(allMatches, totalSlots, ec, existingMatchupsSnapshot, duration + breakTime);
    attempts.push({ matches: allMatches, quality, attemptIndex: a });
    if (quality.totalScore >= perfectScore) break;
    if (lastScore !== null && quality.totalScore === lastScore) {
      consecutiveSameScore++;
      if (consecutiveSameScore >= 3) break;
    } else {
      consecutiveSameScore = 0;
    }
    lastScore = quality.totalScore;
  }

  const bestAttempt = attempts.reduce((best, curr) =>
    curr.quality.totalScore > best.quality.totalScore ? curr : best
  );

  return {
    bestAttempt,
    stats: {
      attemptsRun: attempts.length,
      bestAttemptIndex: bestAttempt.attemptIndex,
      bestScore: bestAttempt.quality.totalScore,
      allAttemptScores: attempts.map(a => a.quality.totalScore),
    },
  };
}

// =============================================================================
// Test Helpers
// =============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function checkRefereeConflicts(matches: GeneratedMatch[]): number {
  const byTime = new Map<string, GeneratedMatch[]>();
  for (const m of matches) {
    if (!byTime.has(m.match_date)) byTime.set(m.match_date, []);
    byTime.get(m.match_date)!.push(m);
  }

  let conflicts = 0;
  for (const [, timeMatches] of byTime) {
    const playingTeams = new Set<string>();
    for (const m of timeMatches) {
      playingTeams.add(m.home_team_id);
      playingTeams.add(m.away_team_id);
    }
    for (const m of timeMatches) {
      if (m.referee_team_id && playingTeams.has(m.referee_team_id)) {
        conflicts++;
      }
    }
  }
  return conflicts;
}

function checkBackToBack(matches: GeneratedMatch[], slotIntervalMinutes: number = 15): number {
  const parseMinutes = (iso: string): number => {
    const timePart = iso.split('T')[1];
    const [h, m] = timePart.split(':').map(Number);
    return h * 60 + m;
  };

  const teamTimes = new Map<string, Array<{ day: string; minutes: number }>>();
  for (const m of matches) {
    const day = m.match_date.split('T')[0];
    const minutes = parseMinutes(m.match_date);
    for (const t of [m.home_team_id, m.away_team_id]) {
      if (!teamTimes.has(t)) teamTimes.set(t, []);
      teamTimes.get(t)!.push({ day, minutes });
    }
  }

  let b2b = 0;
  for (const [, times] of teamTimes) {
    times.sort((a, b) => a.day.localeCompare(b.day) || a.minutes - b.minutes);
    for (let i = 0; i < times.length - 1; i++) {
      if (times[i].day === times[i + 1].day) {
        const gap = times[i + 1].minutes - times[i].minutes;
        // True back-to-back: consecutive slots (exactly 1 slot interval)
        if (gap <= slotIntervalMinutes) b2b++;
      }
    }
  }
  return b2b;
}

function checkNearBackToBack(matches: GeneratedMatch[], slotIntervalMinutes: number = 15): number {
  const parseMinutes = (iso: string): number => {
    const timePart = iso.split('T')[1];
    const [h, m] = timePart.split(':').map(Number);
    return h * 60 + m;
  };

  const gapThreshold = BACK_TO_BACK_GAP * slotIntervalMinutes; // 2 * 15 = 30 min

  const teamTimes = new Map<string, Array<{ day: string; minutes: number }>>();
  for (const m of matches) {
    const day = m.match_date.split('T')[0];
    const minutes = parseMinutes(m.match_date);
    for (const t of [m.home_team_id, m.away_team_id]) {
      if (!teamTimes.has(t)) teamTimes.set(t, []);
      teamTimes.get(t)!.push({ day, minutes });
    }
  }

  let nearB2b = 0;
  for (const [, times] of teamTimes) {
    times.sort((a, b) => a.day.localeCompare(b.day) || a.minutes - b.minutes);
    for (let i = 0; i < times.length - 1; i++) {
      if (times[i].day === times[i + 1].day) {
        const gap = times[i + 1].minutes - times[i].minutes;
        if (gap <= gapThreshold) nearB2b++;
      }
    }
  }
  return nearB2b;
}

function checkMatchBalance(matches: GeneratedMatch[]): { min: number; max: number } {
  const teamCounts = new Map<string, number>();
  for (const m of matches) {
    teamCounts.set(m.home_team_id, (teamCounts.get(m.home_team_id) ?? 0) + 1);
    teamCounts.set(m.away_team_id, (teamCounts.get(m.away_team_id) ?? 0) + 1);
  }
  const counts = [...teamCounts.values()];
  return { min: Math.min(...counts), max: Math.max(...counts) };
}

function checkMatchupRepeats(matches: GeneratedMatch[]): number {
  const matchups = new Map<string, number>();
  for (const m of matches) {
    const key = [m.home_team_id, m.away_team_id].sort().join('-');
    matchups.set(key, (matchups.get(key) ?? 0) + 1);
  }
  let repeats = 0;
  for (const [, count] of matchups) {
    if (count > 1) repeats += (count - 1);
  }
  return repeats;
}

function checkRefereeBalance(matches: GeneratedMatch[]): { min: number; max: number } {
  const refCounts = new Map<string, number>();
  for (const m of matches) {
    if (m.referee_team_id) {
      refCounts.set(m.referee_team_id, (refCounts.get(m.referee_team_id) ?? 0) + 1);
    }
  }
  const counts = [...refCounts.values()];
  if (counts.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...counts), max: Math.max(...counts) };
}

// =============================================================================
// Test Scenarios
// =============================================================================

function runScenario(
  name: string,
  events: EventDateConfig[],
  constraints: EventConstraints,
  duration: number,
  breakTime: number,
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SCENARIO: ${name}`);
  console.log(`${'='.repeat(60)}`);

  const { bestAttempt, stats } = runEventModeMultiAttempt(
    events, duration, breakTime, constraints,
    new Map(), new Map(),
    'comp-1', 'season-1', 'regular_season'
  );

  const matches = bestAttempt.matches;
  const quality = bestAttempt.quality;

  console.log(`\nStats: ${stats.attemptsRun} attempts, best=#${stats.bestAttemptIndex} (score ${stats.bestScore})`);
  console.log(`Matches: ${matches.length}, Unfilled: ${quality.unfilledSlots}`);
  console.log(`Quality: repeats=${quality.repeatViolations}, b2b=${quality.backToBackViolations}, imbalance=${quality.matchImbalanceStdDev.toFixed(2)}, refImbalance=${quality.refereeImbalanceStdDev.toFixed(2)}`);

  return { matches, quality, stats };
}

// --- Scenario A: 10 teams, 2 fields, 19:00-21:45, 15min slot (your real case) ---
console.log('\n' + '#'.repeat(60));
console.log('# SCHEDULING ALGORITHM TESTS');
console.log('#'.repeat(60));

const teamsA = Array.from({ length: 10 }, (_, i) => `team-${i + 1}`);
const { matches: matchesA } = runScenario(
  'A: 10 teams, 2 fields, 19:00-21:45, 15min (real case)',
  [{
    date: '2026-03-15',
    startTime: '19:00',
    endTime: '21:45',
    venueIds: ['venue-1', 'venue-2'],
    teamIds: teamsA,
  }],
  { avoidRepeats: true, balanceMatches: true, avoidBackToBack: true, autoReferee: true },
  15, 0
);

console.log('\nAssertions:');
assert(checkRefereeConflicts(matchesA) === 0, 'Zero referee-playing conflicts');
assert(checkBackToBack(matchesA) === 0, 'Zero back-to-back (consecutive slots)');
assert(checkNearBackToBack(matchesA) === 0, 'Zero near-back-to-back (2-slot gap enforced)');
const balA = checkMatchBalance(matchesA);
assert(balA.max - balA.min <= 1, `Match balance ±1 (min=${balA.min}, max=${balA.max})`);
assert(checkMatchupRepeats(matchesA) === 0, 'Zero matchup repeats');
const refBalA = checkRefereeBalance(matchesA);
assert(refBalA.max - refBalA.min <= 2, `Referee balance ±2 (min=${refBalA.min}, max=${refBalA.max})`);

// --- Scenario B: 6 teams, 1 field, 18:00-20:00, 15min slot (tighter) ---
const teamsB = Array.from({ length: 6 }, (_, i) => `team-${i + 1}`);
const { matches: matchesB } = runScenario(
  'B: 6 teams, 1 field, 18:00-20:00, 15min (tight)',
  [{
    date: '2026-03-20',
    startTime: '18:00',
    endTime: '20:00',
    venueIds: ['venue-1'],
    teamIds: teamsB,
  }],
  { avoidRepeats: true, balanceMatches: true, avoidBackToBack: true, autoReferee: true },
  15, 0
);

console.log('\nAssertions:');
assert(checkRefereeConflicts(matchesB) === 0, 'Zero referee-playing conflicts');
assert(checkBackToBack(matchesB) === 0, 'Zero back-to-back');
assert(checkNearBackToBack(matchesB) === 0, 'Zero near-back-to-back');
assert(checkMatchupRepeats(matchesB) === 0, 'Zero matchup repeats');

// --- Scenario C: 10 teams, 2 fields, 2 events on different days (cross-event) ---
const { matches: matchesC } = runScenario(
  'C: 10 teams, 2 fields, 2 events different days',
  [
    {
      date: '2026-03-15',
      startTime: '19:00',
      endTime: '21:00',
      venueIds: ['venue-1', 'venue-2'],
      teamIds: teamsA,
    },
    {
      date: '2026-03-22',
      startTime: '19:00',
      endTime: '21:00',
      venueIds: ['venue-1', 'venue-2'],
      teamIds: teamsA,
    },
  ],
  { avoidRepeats: true, balanceMatches: true, avoidBackToBack: true, autoReferee: true },
  15, 0
);

console.log('\nAssertions:');
assert(checkRefereeConflicts(matchesC) === 0, 'Zero referee-playing conflicts (cross-event)');
assert(checkBackToBack(matchesC) === 0, 'Zero back-to-back (cross-event)');
assert(checkNearBackToBack(matchesC) === 0, 'Zero near-back-to-back (cross-event)');
const balC = checkMatchBalance(matchesC);
assert(balC.max - balC.min <= 1, `Match balance ±1 cross-event (min=${balC.min}, max=${balC.max})`);
assert(checkMatchupRepeats(matchesC) === 0, 'Zero matchup repeats (cross-event)');

// --- Scenario D: 4 teams, 2 fields (very constrained) ---
const teamsD = Array.from({ length: 4 }, (_, i) => `team-${i + 1}`);
const { matches: matchesD } = runScenario(
  'D: 4 teams, 2 fields, 19:00-20:30 (very constrained)',
  [{
    date: '2026-04-01',
    startTime: '19:00',
    endTime: '20:30',
    venueIds: ['venue-1', 'venue-2'],
    teamIds: teamsD,
  }],
  { avoidRepeats: true, balanceMatches: true, avoidBackToBack: true, autoReferee: true },
  15, 0
);

console.log('\nAssertions:');
assert(checkRefereeConflicts(matchesD) === 0, 'Zero referee-playing conflicts (constrained)');
assert(checkBackToBack(matchesD) === 0, 'Zero back-to-back (constrained)');
assert(checkMatchupRepeats(matchesD) === 0, 'Zero matchup repeats (constrained)');

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}`);

if (failed > 0) {
  process.exit(1);
}
