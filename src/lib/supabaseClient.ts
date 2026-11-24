import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://tu-proyecto-purisima.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo_clave_publica_anonima";

/**
 * true si la app tiene un proyecto de Supabase de verdad (.env). Sin él (pruebas, demos), las
 * pantallas que lo admiten usan sus datos de prueba en vez de llamar a una URL que no existe.
 */
export const supabaseConfigurado = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
