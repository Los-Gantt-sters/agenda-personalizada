// Progreso e historial del alumno para la pantalla 43 (HU-25, SCRUM-146).
// Llama a la función progreso_alumno de Supabase (SCRUM-145), que lo calcula todo en una sola
// consulta. Tutor y familia ven todas las tareas del alumno, de clase y de casa; la función rechaza a
// quien no supervisa al alumno.
import { supabase } from "../lib/supabaseClient";
import type { ProgresoAlumno, RepositorioProgreso } from "../componentes/progreso/tipos";

const VACIO: Omit<ProgresoAlumno, "desde" | "hasta"> = {
  alumno: null,
  resumen: {
    total: 0,
    hechas: 0,
    pendientes: 0,
    en_curso: 0,
    bloqueadas: 0,
    sin_terminar: 0,
    planes_b: 0,
  },
  emociones: [],
  dias: [],
  tareas: [],
  avisos: [],
};

/** Mensaje en Lectura Fácil para cada fallo que se puede esperar. */
function mensajeDeError(error: { code?: string; message?: string }): string {
  if (error.code === "42501") return "No tienes permiso para ver el progreso de este alumno.";
  if (error.code === "22023") return "Ese periodo no es válido. Elige otro.";
  return "No se ha podido cargar el progreso. Comprueba la conexión e inténtalo otra vez.";
}

/** Progreso del alumno entre dos fechas AAAA-MM-DD (las dos incluidas). */
export async function obtenerProgresoAlumno(
  estudianteId: string,
  desde: string,
  hasta: string,
): Promise<ProgresoAlumno> {
  const { data, error } = await supabase.rpc("progreso_alumno", {
    p_estudiante: estudianteId,
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw new Error(mensajeDeError(error));
  const datos = (data ?? {}) as Partial<ProgresoAlumno>;
  return {
    ...VACIO,
    ...datos,
    desde: datos.desde ?? desde,
    hasta: datos.hasta ?? hasta,
    resumen: { ...VACIO.resumen, ...datos.resumen },
  };
}

/** Repositorio del progreso contra Supabase, para pasárselo a la pantalla. */
export const repositorioProgresoSupabase: RepositorioProgreso = {
  obtener: obtenerProgresoAlumno,
};
