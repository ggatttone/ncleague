import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://REDACTED_PROJECT_1.supabase.co';
const supabaseKey = 'REDACTED_SUPABASE_ANON_KEY_1';

export const supabase = createClient(supabaseUrl, supabaseKey);