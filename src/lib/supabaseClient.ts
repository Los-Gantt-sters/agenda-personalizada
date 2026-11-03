import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://tu-proyecto-purisima.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo_clave_publica_anonima";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
