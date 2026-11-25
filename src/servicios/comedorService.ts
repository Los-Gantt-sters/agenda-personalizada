/**
 * Recuento del comedor y parte del día para Cocina (HU-12 · SCRUM-102 · T-12.1).
 * Llama a las funciones de supabase/migrations/20261127100000_recuento_comedor.sql:
 * - Pantalla 11 (alumno encargado): clases con sus compañeros y confirmar quién falta en cada una.
 * - Pantalla 54 (Cocina): menús por tipo y total de comensales restando a los que faltan hoy,
 *   aulas confirmadas, la última clase confirmada y las alergias de los que comen.
 * Cada función comprueba en la base de datos el rol de quien la llama.
 */
import { supabase } from "../lib/supabaseClient";
import type { AlumnosResult } from "../tipos/alumnos";

export const ERROR_RECUENTO_COMEDOR = "No se ha podido cargar el recuento del comedor.";
export const ERROR_PARTE_COCINA_DIA = "No se ha podido cargar el parte de cocina.";

export interface CompaneroComedor {
  id: string;
  /** Solo el nombre de pila. */
  nombre: string;
  icono: string | null;
  color: string | null;
}

/** Una clase del recuento de hoy (un paso de la pantalla 11). */
export interface ClaseRecuento {
  aulaId: string;
  nombre: string;
  iconoForma: string | null;
  iconoUrl: string | null;
  alumnos: CompaneroComedor[];
  /** Si ya se ha contado hoy, y a quién se apuntó como ausente. */
  confirmado: boolean;
  ausentes: string[];
}

export interface MenuDia {
  /** Tipo de menú tal como se guarda: normal, turmix, texturizada, sin_gluten... */
  tipo: string;
  total: number;
}

export interface AvisoAlergia {
  alumnoId: string;
  nombre: string;
  aula?: string;
  alergias: string[];
  observaciones: string;
}

/** Parte del día de la pantalla 54. */
export interface ParteCocinaDia {
  fecha: string;
  /** Comensales de hoy: alumnos activos menos los que faltan. */
  total: number;
  ausentes: number;
  menus: MenuDia[];
  aulasTotal: number;
  aulasConfirmadas: number;
  /** Última clase confirmada y a qué hora (HH:MM, hora del centro); null si aún ninguna. */
  ultima: { aula: string; hora: string } | null;
  avisos: AvisoAlergia[];
}

interface FilaClase {
  aula_id: string;
  nombre: string | null;
  icono_forma: string | null;
  icono_url: string | null;
  alumnos:
    { id: string; nombre: string | null; icono: string | null; color: string | null }[] | null;
  confirmado: boolean | null;
  ausentes: string[] | null;
}

interface FilaParte {
  fecha?: string;
  total?: number;
  ausentes?: number;
  menus?: { tipo: string; total: number }[];
  aulas_total?: number;
  aulas_confirmadas?: number;
  ultima?: { aula: string; hora: string } | null;
  avisos?: {
    alumno_id: string;
    nombre: string;
    aula?: string | null;
    alergias?: string[] | null;
    observaciones?: string | null;
  }[];
}

const mensajeDe = (err: unknown) => (err instanceof Error ? err.message : "Error desconocido");

/** Pantalla 11: clases de hoy con sus compañeros, en el orden de la 48b. */
export async function obtenerRecuentoComedorHoy(): Promise<AlumnosResult<ClaseRecuento[]>> {
  try {
    const { data, error } = await supabase.rpc("recuento_comedor_hoy");
    if (error) return { success: false, error: ERROR_RECUENTO_COMEDOR };
    const clases = ((data ?? []) as FilaClase[]).map((f) => ({
      aulaId: f.aula_id,
      nombre: f.nombre ?? "",
      iconoForma: f.icono_forma ?? null,
      iconoUrl: f.icono_url ?? null,
      alumnos: (f.alumnos ?? []).map((a) => ({
        id: a.id,
        nombre: a.nombre ?? "",
        icono: a.icono ?? null,
        color: a.color ?? null,
      })),
      confirmado: Boolean(f.confirmado),
      ausentes: f.ausentes ?? [],
    }));
    return { success: true, data: clases };
  } catch (err: unknown) {
    return { success: false, error: mensajeDe(err) };
  }
}

/** Pantalla 11, «Siguiente»: guarda quién falta hoy en una clase. Devuelve la hora guardada. */
export async function confirmarRecuentoComedor(
  aulaId: string,
  ausentes: string[],
): Promise<AlumnosResult<string>> {
  try {
    const { data, error } = await supabase.rpc("confirmar_recuento_comedor", {
      p_aula: aulaId,
      p_ausentes: ausentes,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: String(data) };
  } catch (err: unknown) {
    return { success: false, error: mensajeDe(err) };
  }
}

/** Pantalla 54: parte del día para Cocina. */
export async function obtenerParteCocinaDia(): Promise<AlumnosResult<ParteCocinaDia>> {
  try {
    const { data, error } = await supabase.rpc("parte_cocina_dia");
    if (error || !data) return { success: false, error: ERROR_PARTE_COCINA_DIA };
    const f = data as FilaParte;
    return {
      success: true,
      data: {
        fecha: f.fecha ?? "",
        total: Number(f.total ?? 0),
        ausentes: Number(f.ausentes ?? 0),
        menus: (f.menus ?? []).map((m) => ({ tipo: m.tipo, total: Number(m.total) })),
        aulasTotal: Number(f.aulas_total ?? 0),
        aulasConfirmadas: Number(f.aulas_confirmadas ?? 0),
        ultima: f.ultima ?? null,
        avisos: (f.avisos ?? []).map((a) => ({
          alumnoId: a.alumno_id,
          nombre: a.nombre,
          aula: a.aula ?? undefined,
          alergias: a.alergias ?? [],
          observaciones: a.observaciones ?? "",
        })),
      },
    };
  } catch (err: unknown) {
    return { success: false, error: mensajeDe(err) };
  }
}
