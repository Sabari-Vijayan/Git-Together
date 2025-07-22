import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://flmvntmapsmkipqsnwvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbXZudG1hcHNta2lwcXNud3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5OTU3OTcsImV4cCI6MjA2ODU3MTc5N30.Ad1m0tLA5w6Z8XGt56IJJWcNajl5BDGFizpj-62LCYE';

export const supabase = createClient(supabaseUrl, supabaseKey);
