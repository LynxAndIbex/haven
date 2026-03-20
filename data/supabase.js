import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aqkznuxhdadwufwkokli.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6AWrpEDErEiTW92CJavt9A_Z3i6qWJw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});