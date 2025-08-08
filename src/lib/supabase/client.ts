import { createClient } from '@supabase/supabase-js';

// ⚠️ SOSTITUISCI CON LE CREDENZIALI DEL TUO NUOVO PROGETTO
const supabaseUrl = 'https://nmosasgxzisbubmsqdsw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tb3Nhc2d4emlzYnVibXNxZHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDQxNTUsImV4cCI6MjA3MDIyMDE1NX0.9ENeOQt9gRjLOgYWhXw1x_LpqXKCQMlYpupcpC4zxJY';

export const supabase = createClient(supabaseUrl, supabaseKey);