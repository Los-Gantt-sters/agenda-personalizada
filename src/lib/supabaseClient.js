/**
 * ==============================================================================
 * Agensible - CEE Fundación Purísima Concepción
 * Inicialización segura del cliente Supabase (RNF15.3 / RNF16.1 / SCRUM-157)
 * ==============================================================================
 * Centraliza la conexión con el BaaS de Supabase utilizando variables de entorno
 * aisladas fuera del código fuente.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Comprueba si las variables de entorno de Supabase están configuradas correctamente
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto-purisima') &&
  !supabaseAnonKey.includes('ejemplo_anon_key')
);

/**
 * Cliente Supabase oficial con persistencia de tokens JWT y auto-refresco
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-agensible.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'agensible_auth_token'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/**
 * Comprobar estado de conectividad con Supabase Auth
 */
export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Variables de entorno no configuradas (usa .env.local basado en .env.example)'
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return {
      connected: true,
      message: 'Conexión exitosa con Supabase BaaS (Auth / REST)'
    };
  } catch (err) {
    return {
      connected: false,
      message: `Error de conexión: ${err.message}`
    };
  }
}

export default supabase;
