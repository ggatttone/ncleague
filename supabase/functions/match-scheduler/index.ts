import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

function generateRoundRobinPairings(teams: any[], includeReturnGames: boolean) {
    const pairings: { home_team_id: string, away_team_id: string }[] = [];
    let teamList = [...teams];

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
                pairings.push({ home_team_id: home.id, away_team_id: away.id });
            }
        }
        const last = teamList.pop();
        if (last) {
            teamList.splice(1, 0, last);
        }
    }

    if (includeReturnGames) {
        const returnPairings = pairings.map(p => ({ home_team_id: p.away_team_id, away_team_id: p.home_team_id }));
        return [...pairings, ...returnPairings];
    }

    return pairings;
}

function generateSlots(constraints: any) {
    const slots: { match_date: string, venue_id: string }[] = [];
    const { startDate, endDate, allowedDays, timeSlots, venueIds } = constraints;
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
        if (allowedDays.includes(currentDate.getDay())) { // 0=Sun, 1=Mon...
            for (const time of timeSlots) {
                for (const venueId of venueIds) {
                    const [hours, minutes] = time.split(':');
                    const matchDate = new Date(currentDate);
                    matchDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                    slots.push({ match_date: matchDate.toISOString(), venue_id: venueId });
                }
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return slots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const isAdmin = await isUserAdmin(userSupabaseClient);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Access denied.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { dryRun, schedule } = await req.json();

    if (!dryRun) {
        // Save the provided schedule
        const adminSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        const { data, error } = await adminSupabaseClient.from('matches').insert(schedule).select();
        if (error) throw error;
        return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate a new schedule (dry run)
    const { season_id, stage, constraints } = schedule;
    if (!season_id || !stage || !constraints) {
        return new Response(JSON.stringify({ error: 'season_id, stage, and constraints are required for a dry run.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminSupabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    const { data: seasonData, error: seasonError } = await adminSupabaseClient.from('seasons').select('competitions(id), season_teams(teams(id))').eq('id', season_id).single();
    if (seasonError) throw seasonError;
    
    const teams = (seasonData as any).season_teams.map((st: any) => st.teams);
    const competition_id = (seasonData as any).competitions.id;

    if (!teams || teams.length < 2) throw new Error('Not enough teams in the season.');

    const pairings = generateRoundRobinPairings(teams, constraints.includeReturnGames);
    const slots = generateSlots(constraints);

    if (pairings.length > slots.length) {
        throw new Error(`Not enough available slots (${slots.length}) to schedule all matches (${pairings.length}).`);
    }

    const generatedMatches = pairings.map((pairing, index) => ({
        ...pairing,
        ...slots[index],
        competition_id,
        season_id,
        stage,
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
    }));

    return new Response(JSON.stringify(generatedMatches), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})