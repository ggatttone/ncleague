import { createClient } from '@supabase/supabase-js';

// ⚠️ SOSTITUISCI CON LE CREDENZIALI DEL TUO NUOVO PROGETTO
const supabaseUrl = 'https://REDACTED_PROJECT_2.supabase.co';
const supabaseKey = 'TUA_NUOVA_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);