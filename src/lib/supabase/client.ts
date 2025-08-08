import { createClient } from '@supabase/supabase-js';

// ⚠️ SOSTITUISCI CON LE CREDENZIALI DEL TUO NUOVO PROGETTO
const supabaseUrl = 'https://REDACTED_PROJECT_2.supabase.co';
const supabaseKey = 'REDACTED_SUPABASE_ANON_KEY_2';

export const supabase = createClient(supabaseUrl, supabaseKey);