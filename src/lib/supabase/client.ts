import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czhcezvcpggaoztpberd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6aGNlenZjcGdnYW96dHBiZXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTc3ODEsImV4cCI6MjA2OTM3Mzc4MX0.IP_8TS4hyfcCWUIDDpx-wORbLajTA6qbz5BxOirPnbI';

export const supabase = createClient(supabaseUrl, supabaseKey);