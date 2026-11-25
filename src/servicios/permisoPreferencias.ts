// SCRUM-246 · T-ACC.2: ¿puede el alumno abrir Preferencias (16)? Lo decide su tutor en Permisos del
// alumno (26d), que se guarda en preferencias_alumnos.nivel_permisos_preferencias:
//   - «ninguno»: el botón Preferencias no sale;
//   - «parcial» o «total»: sale y lleva siempre al menú 16.
// El alumno de la sesión se saca del correo técnico del inicio de sesión visual (SCRUM-51):
// «alu-<id del alumno>@alumnos.agensible».
import { supabase } from "../lib/supabaseClient";

const CORREO_ALUMNO = /^alu-(.+)@alumnos\.agensible$/i;
const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id del alumno a partir del correo técnico de su sesión, o null si no es un alumno. */
export function alumnoDeCorreo(correo: string | null | undefined): string | null {
  const m = CORREO_ALUMNO.exec((correo ?? "").trim());
  return m ? m[1] : null;
}

// Una consulta por alumno mientras la app está abierta: la barra de abajo sale en cada pantalla.
const cache = new Map<string, Promise<boolean>>();

/** Vacía la caché (al cerrar sesión y en las pruebas). */
export function olvidarPermisosPreferencias(): void {
  cache.clear();
}

/**
 * true si el alumno tiene permiso para abrir Preferencias. Los alumnos de ejemplo (sin UUID) lo
 * tienen; ante un fallo de conexión no se le quita (Preferencias solo cambia cómo se ve la app).
 */
export function obtenerPermisoPreferencias(alumnoId: string): Promise<boolean> {
  if (!ES_UUID.test(alumnoId)) return Promise.resolve(true);
  const guardado = cache.get(alumnoId);
  if (guardado) return guardado;
  const consulta = (async () => {
    try {
      const { data, error } = await supabase
        .from("preferencias_alumnos")
        .select("nivel_permisos_preferencias")
        .eq("alumno_id", alumnoId)
        .maybeSingle();
      if (error || !data) return true;
      return data.nivel_permisos_preferencias !== "ninguno";
    } catch {
      return true;
    }
  })();
  cache.set(alumnoId, consulta);
  return consulta;
}
