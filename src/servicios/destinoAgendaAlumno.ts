// SCRUM-227 (deuda técnica HU-01 → HU-06): a dónde se lleva al alumno tras el inicio de sesión visual.
//
// Tras entrar, el alumno debe ver SU agenda con sus datos reales de Supabase: la semanal (06b) o la
// diaria (06) según la preferencia `vista_agenda` que configura el tutor. Mientras la pantalla 06b
// no exista (la hace SCRUM-232/250), la ruta lleva `vista=semanal` y la agenda diaria la ignora;
// cuando esté lista bastará con leer ese parámetro, sin tocar el inicio de sesión.
import { supabase } from "../lib/supabaseClient";

export type VistaAgenda = "diaria" | "semanal";

const RUTA_AGENDA = "/agenda";
const VISTA_POR_DEFECTO: VistaAgenda = "diaria";
const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Los alumnos de ejemplo del acceso (por ejemplo «ale») no existen en Supabase: solo los
 * identificadores reales (UUID) se pueden consultar. Con uno de ejemplo se abre la demo de la agenda.
 */
export function esIdDeAlumnoReal(alumnoId: string): boolean {
  return ES_UUID.test(alumnoId);
}

/** Ruta de la agenda del alumno: `/agenda?estudiante=<id>` y, si toca, `&vista=semanal`. */
export function rutaAgendaAlumno(alumnoId: string, vista: VistaAgenda = VISTA_POR_DEFECTO): string {
  if (!esIdDeAlumnoReal(alumnoId)) return RUTA_AGENDA;
  const ruta = `${RUTA_AGENDA}?estudiante=${encodeURIComponent(alumnoId)}`;
  return vista === "semanal" ? `${ruta}&vista=semanal` : ruta;
}

/** Vista de agenda que tiene configurada el alumno. Ante cualquier fallo, la diaria. */
export async function obtenerVistaAgenda(alumnoId: string): Promise<VistaAgenda> {
  if (!esIdDeAlumnoReal(alumnoId)) return VISTA_POR_DEFECTO;
  try {
    const { data, error } = await supabase
      .from("preferencias_alumnos")
      .select("vista_agenda")
      .eq("alumno_id", alumnoId)
      .maybeSingle();
    if (error) return VISTA_POR_DEFECTO;
    return data?.vista_agenda === "semanal" ? "semanal" : VISTA_POR_DEFECTO;
  } catch {
    // Sin conexión u otro fallo: el alumno no debe quedarse sin agenda
    return VISTA_POR_DEFECTO;
  }
}

/** Ruta a la que se lleva al alumno justo después de iniciar sesión. */
export async function destinoTrasLoginAlumno(alumnoId: string): Promise<string> {
  return rutaAgendaAlumno(alumnoId, await obtenerVistaAgenda(alumnoId));
}
