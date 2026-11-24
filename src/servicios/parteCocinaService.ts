/**
 * Parte diario de Cocina (SCRUM-235 / SCRUM-261 · datos de la pantalla 54).
 * Reúne lo que Administración fija en la pantalla 46: cuántos comensales hay de cada tipo de menú y
 * qué alumnos tienen alergias u observaciones. Se calcula al momento con la función `parte_cocina`
 * de la base de datos, así que no hay nada que sincronizar a mano. Cuenta a todo el alumnado activo:
 * las ausencias del día se apuntan en un folio y las gestiona Cocina.
 */

import { supabase } from "../lib/supabaseClient";
import type { AlumnosResult } from "../tipos/alumnos";

export const ERROR_PARTE_COCINA = "No se ha podido cargar el parte de cocina.";

export interface MenuComensales {
  /** Tipo de menú tal como se guarda: normal, turmix, texturizada, sin_gluten... */
  tipo: string;
  total: number;
}

export interface AvisoCocina {
  alumnoId: string;
  nombre: string;
  apellidos?: string;
  aula?: string;
  alergias: string[];
  observaciones: string;
}

export interface ParteCocina {
  total: number;
  menus: MenuComensales[];
  avisos: AvisoCocina[];
}

/** Parte de Cocina del día: comensales por tipo de menú y alumnos con alergias u observaciones. */
export async function obtenerParteCocina(): Promise<AlumnosResult<ParteCocina>> {
  try {
    const { data, error } = await supabase.rpc("parte_cocina");
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: ERROR_PARTE_COCINA };

    const parte: ParteCocina = {
      total: Number(data.total ?? 0),
      menus: (data.menus ?? []).map((m: any) => ({ tipo: m.tipo, total: Number(m.total) })),
      avisos: (data.avisos ?? []).map((a: any) => ({
        alumnoId: a.alumno_id,
        nombre: a.nombre,
        apellidos: a.apellidos ?? undefined,
        aula: a.aula ?? undefined,
        alergias: a.alergias ?? [],
        observaciones: a.observaciones ?? "",
      })),
    };
    return { success: true, data: parte };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
