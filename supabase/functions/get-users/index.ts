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

    // Recupera tutti gli utenti da auth.users
    const { data: { users }, error: usersError } = await adminSupabaseClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Recupera tutti i profili dalla tabella public.profiles
    const { data: profiles, error: profilesError } = await adminSupabaseClient
      .from('profiles')
      .select('*');
    if (profilesError) throw profilesError;

    // Crea una mappa delle email degli utenti per una facile ricerca
    const userMap = new Map(users.map(u => [u.id, u.email]));

    // Combina i dati del profilo con l'email dell'utente
    const combinedData = profiles.map(profile => ({
      ...profile,
      email: userMap.get(profile.id) || 'N/A',
    }));

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