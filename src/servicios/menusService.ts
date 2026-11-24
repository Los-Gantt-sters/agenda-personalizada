/**
 * Menús y alergias por alumno (SCRUM-235 / SCRUM-260 · pantallas 46 y 46b de Administración).
 * Lo que se guarda aquí lo lee la cocina en el parte diario (pantalla 54). Solo administración
 * lo cambia: el alumno del comedor únicamente anota quién falta.
 */

import { IDS_TIPOS_MENU } from "../componentes/administracion/menus";
import { supabase } from "../lib/supabaseClient";
import type { AlumnosResult, DietaComedor } from "../tipos/alumnos";

export const ERROR_TIPO_MENU = "El tipo de menú no es válido.";

export interface MenuAlumno {
  id: string;
  nombre: string;
  apellidos?: string;
  aula?: string;
  dietaComedor: DietaComedor;
  alergias: string[];
  observacionesCocina: string;
}

export interface CambiosMenu {
  dietaComedor: DietaComedor;
  alergias: string[];
  observacionesCocina: string;
}

/** Quita espacios y repetidos (sin distinguir mayúsculas) y descarta las alergias vacías. */
export function limpiarAlergias(alergias: string[]): string[] {
  const vistas = new Set<string>();
  const limpias: string[] = [];
  for (const a of alergias) {
    const texto = a.trim();
    const clave = texto.toLowerCase();
    if (!texto || vistas.has(clave)) continue;
    vistas.add(clave);
    limpias.push(texto);
  }
  return limpias;
}

/** Alumnos activos con su aula, su tipo de menú y sus alergias. */
export async function listarMenusAlumnos(): Promise<AlumnosResult<MenuAlumno[]>> {
  try {
    const { data, error } = await supabase
      .from("alumnos")
      .select("id, nombre, apellidos, dieta_comedor, alergias, observaciones_cocina, aulas(nombre)")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    if (error) return { success: false, error: error.message };

    const menus: MenuAlumno[] = (data || []).map((row: any) => {
      // Sin tipos generados, Supabase puede devolver la relación como objeto o como lista de uno
      const aula = Array.isArray(row.aulas) ? row.aulas[0] : row.aulas;
      return {
        id: row.id,
        nombre: row.nombre,
        apellidos: row.apellidos ?? undefined,
        aula: aula?.nombre,
        dietaComedor: row.dieta_comedor,
        alergias: row.alergias ?? [],
        observacionesCocina: row.observaciones_cocina ?? "",
      };
    });
    return { success: true, data: menus };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/** Guarda el tipo de menú, las alergias y las observaciones para cocina de un alumno. */
export async function guardarMenuAlumno(
  alumnoId: string,
  cambios: CambiosMenu,
): Promise<AlumnosResult<CambiosMenu>> {
  if (!IDS_TIPOS_MENU.includes(cambios.dietaComedor)) {
    return { success: false, error: ERROR_TIPO_MENU };
  }
  const guardado: CambiosMenu = {
    dietaComedor: cambios.dietaComedor,
    alergias: limpiarAlergias(cambios.alergias),
    observacionesCocina: cambios.observacionesCocina.trim(),
  };

  try {
    const { error } = await supabase
      .from("alumnos")
      .update({
        dieta_comedor: guardado.dietaComedor,
        alergias: guardado.alergias,
        // Vacío se guarda como null: así la cocina no ve una nota en blanco
        observaciones_cocina: guardado.observacionesCocina || null,
      })
      .eq("id", alumnoId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: guardado };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
