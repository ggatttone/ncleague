import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Funzione per verificare se l'utente che invoca è un amministratore
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

serve(async (req) => {
  // Gestisce la richiesta pre-flight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Crea un client Supabase con l'autorizzazione dell'utente che ha effettuato la richiesta
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verifica che l'utente sia un amministratore prima di procedere
    const isAdmin = await isUserAdmin(userSupabaseClient);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Accesso negato: l\'utente non è un amministratore.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se l'utente è un admin, crea un client con la service role key per eseguire operazioni di amministrazione
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Recupera tutti gli utenti da auth.users
    const { data: { users }, error: usersError } = await adminSupabaseClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    // 2. Recupera tutti i profili dalla tabella public.profiles
    const { data: profiles, error: profilesError } = await adminSupabaseClient
      .from('profiles')
      .select('*');
    if (profilesError) throw profilesError;

    // 3. Crea una mappa dei profili per una facile ricerca
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // 4. Combina i dati, partendo dalla lista degli utenti (source of truth)
    const combinedData = users.map(user => {
      const profile = profileMap.get(user.id);
      const isBanned = user.banned_until && (new Date(user.banned_until) > new Date() || user.banned_until === 'infinity');
      
      return {
        id: user.id,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        role: profile?.role || 'player', // Default role if profile is missing
        avatar_url: profile?.avatar_url || null,
        updated_at: profile?.updated_at || user.created_at,
        email: user.email,
        status: isBanned ? 'blocked' : 'active',
      };
    });

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})