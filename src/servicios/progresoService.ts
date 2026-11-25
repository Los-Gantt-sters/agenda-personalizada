// Progreso e historial del alumno para la pantalla 43 (HU-25, SCRUM-146).
// Llama a la función progreso_alumno de Supabase (SCRUM-145), que lo calcula todo en una sola
// consulta. Tutor y familia ven todas las tareas del alumno, de clase y de casa; la función rechaza a
// quien no supervisa al alumno.
import { supabase } from "../lib/supabaseClient";
import type {
  ProgresoAlumno,
  RepositorioProgreso,
  ResumenProgreso,
  TareaProgreso,
} from "../componentes/progreso/tipos";

const VACIO: Omit<ProgresoAlumno, "desde" | "hasta"> = {
  alumno: null,
  resumen: {
    total: 0,
    hechas: 0,
    pendientes: 0,
    en_curso: 0,
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

/** Lo que devuelve progreso_alumno: aún puede traer tareas «bloqueada» y su cuenta. */
type TareaCruda = Omit<TareaProgreso, "estado"> & { estado: TareaProgreso["estado"] | "bloqueada" };
type RespuestaCruda = Partial<Omit<ProgresoAlumno, "tareas" | "resumen">> & {
  tareas?: TareaCruda[];
  resumen?: Partial<ResumenProgreso> & { bloqueadas?: number };
};

/**
 * La 43 solo tiene Hecha, En curso, Pendiente y Por hacer. «bloqueada» viene del esquema inicial y
 * ya no la pone ninguna pantalla: si llegara alguna, se cuenta como pendiente (no se pudo hacer),
 * para que no se pierda.
 */
function sinBloqueadas(tarea: TareaCruda): TareaProgreso {
  return tarea.estado === "bloqueada"
    ? { ...tarea, estado: "pendiente", pendiente_motivo: "tiempo_agotado" }
    : { ...tarea, estado: tarea.estado };
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
  const datos = (data ?? {}) as RespuestaCruda;
  const { bloqueadas = 0, ...resumen } = datos.resumen ?? {};
  const juntos = { ...VACIO.resumen, ...resumen };
  return {
    ...VACIO,
    ...datos,
    desde: datos.desde ?? desde,
    hasta: datos.hasta ?? hasta,
    resumen: {
      ...juntos,
      pendientes: juntos.pendientes + bloqueadas,
      sin_terminar: juntos.sin_terminar + bloqueadas,
    },
    tareas: (datos.tareas ?? []).map(sinBloqueadas),
  };
}

/** Repositorio del progreso contra Supabase, para pasárselo a la pantalla. */
export const repositorioProgresoSupabase: RepositorioProgreso = {
  obtener: obtenerProgresoAlumno,
};
