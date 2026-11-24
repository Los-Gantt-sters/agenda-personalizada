/**
 * Servicio de aulas configurables (SCRUM-235 / SCRUM-259 · pantalla 48b de Administración).
 * El administrador pone nombre e icono a cada aula; se ven en la pantalla 01 (alumno) y 35 (tutor).
 * No hay límite de aulas: las pantallas 01 y 35 las reparten en páginas de 9.
 */

import { supabase } from "../lib/supabaseClient";
import type { ActualizarAulaInput, Aula, AlumnosResult, CrearAulaInput } from "../tipos/alumnos";

export const ERROR_NOMBRE_AULA_OBLIGATORIO = "El nombre del aula es obligatorio.";
export const ERROR_AULA_CON_ALUMNOS =
  "No se puede eliminar un aula que tiene alumnos. Muévelos antes a otra aula.";
const CENTRO_POR_DEFECTO = "11111111-1111-1111-1111-111111111111"; // CEE Purísima, igual que alumnosService
const FORMA_POR_DEFECTO = "tri"; // identificador de FormaClase (src/ui/FormaClase.tsx)

/** Convierte una fila de la tabla `aulas` en un Aula de la aplicación. */
function filaAAula(row: any): Aula {
  return {
    id: row.id,
    centroId: row.centro_id,
    nombre: row.nombre,
    iconoForma: row.icono_forma,
    iconoUrl: row.icono_url ?? null,
    colorDistintivo: row.color_distintivo,
    nivel: row.nivel,
    tutorTitularId: row.tutor_titular_id ?? undefined,
    orden: row.orden ?? 0,
    creadoEn: row.creado_en,
  };
}

/** Aulas del centro ordenadas por `orden` y, a igualdad, por nombre. */
export async function obtenerAulas(centroId?: string): Promise<AlumnosResult<Aula[]>> {
  try {
    let query = supabase
      .from("aulas")
      .select("*")
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    if (centroId) query = query.eq("centro_id", centroId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []).map(filaAAula) };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/** Crea un aula nueva al final de la lista (pantalla 48b · «Añadir nueva aula al centro»). */
export async function crearAula(input: CrearAulaInput): Promise<AlumnosResult<Aula>> {
  const nombre = input.nombre?.trim();
  if (!nombre) return { success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO };

  const centroId = input.centroId || CENTRO_POR_DEFECTO;
  try {
    // La nueva aula va detrás de todas las demás
    const { data: ultimas, error: errorOrden } = await supabase
      .from("aulas")
      .select("orden")
      .eq("centro_id", centroId)
      .order("orden", { ascending: false })
      .limit(1);
    if (errorOrden) return { success: false, error: errorOrden.message };
    const orden = ultimas && ultimas.length > 0 ? (ultimas[0].orden ?? 0) + 1 : 0;

    const { data, error } = await supabase
      .from("aulas")
      .insert({
        centro_id: centroId,
        nombre,
        icono_forma: input.iconoForma || FORMA_POR_DEFECTO,
        icono_url: input.iconoUrl ?? null,
        orden,
      })
      .select("*")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: filaAAula(data) };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/** Cambia el nombre y/o el icono de un aula. Solo se envían los campos indicados. */
export async function actualizarAula(
  id: string,
  cambios: ActualizarAulaInput,
): Promise<AlumnosResult<Aula>> {
  const payload: Record<string, unknown> = {};
  if (cambios.nombre !== undefined) {
    const nombre = cambios.nombre.trim();
    if (!nombre) return { success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO };
    payload.nombre = nombre;
  }
  if (cambios.iconoForma !== undefined) payload.icono_forma = cambios.iconoForma;
  if (cambios.iconoUrl !== undefined) payload.icono_url = cambios.iconoUrl;

  try {
    const { data, error } = await supabase
      .from("aulas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: filaAAula(data) };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Guarda de una vez las aulas editadas en la pantalla 48b («Guardar configuración»).
 * El orden de la lista pasa a ser el orden de las aulas en las pantallas 01 y 35.
 */
export async function guardarConfiguracionAulas(
  aulas: Pick<Aula, "id" | "nombre" | "iconoForma" | "iconoUrl">[],
): Promise<AlumnosResult<Aula[]>> {
  if (aulas.some((a) => !a.nombre?.trim())) {
    return { success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO };
  }
  try {
    const guardadas: Aula[] = [];
    for (let i = 0; i < aulas.length; i++) {
      const a = aulas[i];
      const { data, error } = await supabase
        .from("aulas")
        .update({
          nombre: a.nombre.trim(),
          icono_forma: a.iconoForma || FORMA_POR_DEFECTO,
          icono_url: a.iconoUrl ?? null,
          orden: i,
        })
        .eq("id", a.id)
        .select("*")
        .single();
      if (error) return { success: false, error: error.message };
      guardadas.push(filaAAula(data));
    }
    return { success: true, data: guardadas };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/** Elimina un aula vacía. Si tiene alumnos, la base de datos lo impide y se explica el motivo. */
export async function eliminarAula(id: string): Promise<AlumnosResult<null>> {
  try {
    const { error } = await supabase.from("aulas").delete().eq("id", id);
    if (error) {
      // 23503 = violación de clave foránea: hay alumnos (ON DELETE RESTRICT)
      if ((error as { code?: string }).code === "23503") {
        return { success: false, error: ERROR_AULA_CON_ALUMNOS };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: null };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
