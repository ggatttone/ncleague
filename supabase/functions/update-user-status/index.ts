import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function isUserAdmin(supabaseClient: SupabaseClient): Promise<string | null> {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError?.message);
    return null;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profile error:', profileError?.message);
    return null;
  }

  return profile.role === 'admin' ? user.id : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, action } = await req.json();
    if (!userId || !action || !['block', 'unblock'].includes(action)) {
      return new Response(JSON.stringify({ error: 'userId e action (block/unblock) sono obbligatori.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const adminUserId = await isUserAdmin(userSupabaseClient);
    if (!adminUserId) {
      return new Response(JSON.stringify({ error: 'Accesso negato: l\'utente non è un amministratore.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (adminUserId === userId && action === 'block') {
      return new Response(JSON.stringify({ error: 'Un amministratore non può bloccare il proprio account.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ban_duration = action === 'block' ? '3153600000s' : 'none'; // 100 years or none

    const { data: updatedUser, error } = await adminSupabaseClient.auth.admin.updateUserById(
      userId,
      { ban_duration }
    );

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(updatedUser), {
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