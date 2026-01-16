import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase: faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY');
  throw new Error('Supabase config inválida. Revisa .env y reinicia npm start.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
