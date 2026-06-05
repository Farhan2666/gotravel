import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rlklejtsygrtpthhvbhs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsa2xlanRzeWdydHB0aGh2YmhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY4MzIyNywiZXhwIjoyMDk2MjU5MjI3fQ.zA84YzqI261HeZItyKCB_CoP9at_JsFwXlhARMyEOjQ';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
