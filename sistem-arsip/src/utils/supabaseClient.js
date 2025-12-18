import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidConfig = supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your_supabase_project_url_here') &&
    !supabaseAnonKey.includes('your_supabase_anon_key_here');

let supabase = null;

if (isValidConfig) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error('Missing or invalid Supabase configuration. Please check your .env file.');
}

export { supabase };
