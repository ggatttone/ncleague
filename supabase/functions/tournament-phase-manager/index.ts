import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Standard CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to check if the user is an admin
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

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper to generate round-robin matches
function generateRoundRobin(teams: { team_id: string }[], stage: string, competition_id: string, season_id: string): any[] {
    const matches = [];
    const teamList = [...teams];

    if (teamList.length % 2 !== 0) {
        teamList.push({ team_id: 'BYE' }); // Add a bye for odd numbers
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
                    match_date: new Date().toISOString(), // Placeholder date
                    status: 'scheduled',
                    stage,
                });
            }
        }
        // Rotate teams
        const lastTeam = teamList.pop();
        if (lastTeam) {
            teamList.splice(1, 0, lastTeam);
        }
    }
    return matches;
}


serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Security: Verify the user is an admin
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

    // 2. Input Validation
    const { season_id, phase_to_close, manual_overrides } = await req.json();
    if (!season_id || !phase_to_close) {
      return new Response(JSON.stringify({ error: 'season_id and phase_to_close are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create Admin Client for privileged operations
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Log manual overrides if they exist
    if (manual_overrides) {
      const { data: { user } } = await userSupabaseClient.auth.getUser();
      const { error: logError } = await adminSupabaseClient.from('audit_log').insert({
        user_id: user?.id,
        season_id,
        action_description: `Manual override for closing phase: ${phase_to_close}`,
        details: manual_overrides,
      });
      if (logError) throw new Error(`Failed to log manual overrides: ${logError.message}`);
    }

    let newMatches: any[] = [];
    
    // Get competition_id from season, needed for all phases
    const { data: seasonData, error: seasonError } = await adminSupabaseClient.from('seasons').select('competitions(id)').eq('id', season_id).single();
    if (seasonError || !seasonData) throw new Error('Could not retrieve competition for the season.');
    const competition_id = (seasonData as any).competitions.id;
    if (!competition_id) throw new Error('Competition ID not found for the given season.');


    // 5. Main Logic
    switch (phase_to_close) {
      case 'Inizio Torneo': {
        // Generate Fase 1 matches (Swiss System, 1st round is random pairing)
        const { data: seasonTeams, error: teamsError } = await adminSupabaseClient
          .from('season_teams')
          .select('team_id')
          .eq('season_id', season_id);
        if (teamsError) throw teamsError;
        if (!seasonTeams || seasonTeams.length < 2) throw new Error('Not enough teams in the season to start the tournament.');

        const shuffledTeams = shuffleArray(seasonTeams);
        for (let i = 0; i < shuffledTeams.length; i += 2) {
          if (shuffledTeams[i+1]) {
            newMatches.push({
              competition_id,
              season_id,
              home_team_id: shuffledTeams[i].team_id,
              away_team_id: shuffledTeams[i+1].team_id,
              match_date: new Date().toISOString(), // Placeholder
              status: 'scheduled',
              stage: 'regular_season',
            });
          }
        }
        break;
      }

      case 'Fase 1': {
        // Get standings, snapshot, snake-seed, and generate Fase 2 (Round Robin)
        const { data: standings, error: standingsError } = await adminSupabaseClient.rpc('get_ncl_standings', {
          p_competition_id: competition_id,
          p_season_id: season_id,
          p_stage_filter: 'regular_season',
        });
        if (standingsError) throw standingsError;

        // Save snapshot
        const { error: snapshotError } = await adminSupabaseClient.from('phase_snapshots').insert({
          season_id,
          phase_name: 'Fase 1',
          snapshot_data: standings,
        });
        if (snapshotError) throw snapshotError;

        // Snake-seeding for Poule A and B
        const pouleA_teams: { team_id: string }[] = [];
        const pouleB_teams: { team_id: string }[] = [];
        standings.forEach((team: { team_id: string }, index: number) => {
          const rank = index + 1;
          if ([1, 4, 5, 8, 9, 12].includes(rank)) {
            pouleA_teams.push({ team_id: team.team_id });
          } else if ([2, 3, 6, 7, 10, 11].includes(rank)) {
            pouleB_teams.push({ team_id: team.team_id });
          }
        });
        
        // Generate Round Robin matches for both poules
        const pouleA_matches = generateRoundRobin(pouleA_teams, 'poule_a', competition_id, season_id);
        const pouleB_matches = generateRoundRobin(pouleB_teams, 'poule_b', competition_id, season_id);
        newMatches = [...pouleA_matches, ...pouleB_matches];
        break;
      }

      case 'Fase 2': {
        // Get winners of Poule A & B, snapshot, and generate Fase 3 (Final)
        const { data: pouleA_standings, error: pouleA_error } = await adminSupabaseClient.rpc('get_ncl_standings', {
          p_competition_id: competition_id,
          p_season_id: season_id,
          p_stage_filter: 'poule_a',
        });
        if (pouleA_error) throw pouleA_error;
        if (!pouleA_standings || pouleA_standings.length === 0) throw new Error('Could not determine winner of Poule A.');
        
        await adminSupabaseClient.from('phase_snapshots').insert({ season_id, phase_name: 'Fase 2 - Poule A', snapshot_data: pouleA_standings });
        const winnerA = pouleA_standings[0];

        const { data: pouleB_standings, error: pouleB_error } = await adminSupabaseClient.rpc('get_ncl_standings', {
          p_competition_id: competition_id,
          p_season_id: season_id,
          p_stage_filter: 'poule_b',
        });
        if (pouleB_error) throw pouleB_error;
        if (!pouleB_standings || pouleB_standings.length === 0) throw new Error('Could not determine winner of Poule B.');

        await adminSupabaseClient.from('phase_snapshots').insert({ season_id, phase_name: 'Fase 2 - Poule B', snapshot_data: pouleB_standings });
        const winnerB = pouleB_standings[0];

        // Generate Final match
        newMatches.push({
          competition_id,
          season_id,
          home_team_id: winnerA.team_id,
          away_team_id: winnerB.team_id,
          match_date: new Date().toISOString(), // Placeholder
          status: 'scheduled',
          stage: 'final',
        });
        break;
      }

      default:
        throw new Error(`Unknown phase to close: ${phase_to_close}`);
    }

    // 6. Persist new matches
    if (newMatches.length > 0) {
      const { data: insertedMatches, error: insertError } = await adminSupabaseClient
        .from('matches')
        .insert(newMatches)
        .select();
      if (insertError) throw insertError;
      newMatches = insertedMatches;
    }

    // 7. Return the generated matches
    return new Response(JSON.stringify(newMatches), {
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
})