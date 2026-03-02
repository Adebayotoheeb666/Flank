import { createClient } from "@supabase/supabase-js";

// Check for environment variables (Vite for client, process.env for server)
const supabaseUrl = 
  (typeof process !== 'undefined' ? process.env.SUPABASE_URL : (import.meta as any).env?.VITE_SUPABASE_URL) || 
  "REPLACE_ENV.SUPABASE_URL";

const supabaseAnonKey = 
  (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  "REPLACE_ENV.SUPABASE_ANON_KEY";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
