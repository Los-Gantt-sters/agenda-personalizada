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
  const [dieta_comedor, valoracion] = await Promise.all([
    leerDietaComedor(estudianteId),
    leerValoracion(estudianteId, desde, hasta),
  ]);
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
    dieta_comedor,
    valoracion,
  };
}

/**
 * Tipo de menú del alumno para la tarjeta «Comedor» del resumen. Tutor y familia pueden leer la
 * ficha de su alumno. Si falla, la tarjeta dice que no se sabe (no se rompe la pantalla).
 */
async function leerDietaComedor(estudianteId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("alumnos")
      .select("dieta_comedor")
      .eq("id", estudianteId)
      .maybeSingle();
    if (error || !data) return null;
    return (data.dieta_comedor as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * «Valoración docente»: la última observación escrita en una tarea del periodo. Las ejecuciones las
 * pueden leer los supervisores del alumno. Si no hay ninguna o falla, null.
 */
async function leerValoracion(
  estudianteId: string,
  desde: string,
  hasta: string,
): Promise<{ texto: string; fecha: string } | null> {
  try {
    const { data, error } = await supabase
      .from("ejecuciones")
      .select("observaciones, fin, inicio")
      .eq("estudiante_id", estudianteId)
      .gte("inicio", `${desde}T00:00:00`)
      .lte("inicio", `${hasta}T23:59:59`)
      .not("observaciones", "is", null)
      .order("inicio", { ascending: false })
      .limit(5);
    if (error || !data) return null;
    const fila = (data as { observaciones: string | null; inicio: string }[]).find(
      (f) => (f.observaciones ?? "").trim().length > 0,
    );
    return fila
      ? { texto: (fila.observaciones ?? "").trim(), fecha: fila.inicio.slice(0, 10) }
      : null;
  } catch {
    return null;
  }
}

/** Repositorio del progreso contra Supabase, para pasárselo a la pantalla. */
export const repositorioProgresoSupabase: RepositorioProgreso = {
  obtener: obtenerProgresoAlumno,
};
