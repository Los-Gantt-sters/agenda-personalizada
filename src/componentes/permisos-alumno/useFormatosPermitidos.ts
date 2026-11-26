// Formatos que el tutor deja ver a un alumno en sus tareas (pantalla 26d, HU-23 · SCRUM-141).
// Se leen de preferencias_alumnos.formatos_multimedia_permitidos. Mientras cargan, si falla la
// conexión o si el alumno es de ejemplo (sin UUID), devuelve null y la tarea se ve entera.
import { useEffect, useState } from "react";
import { esIdDeAlumnoReal } from "../../servicios/destinoAgendaAlumno";
import { obtenerPermisosAlumno26d } from "../../servicios/permisosAlumnoService";
import type { FormatoMultimediaAlumno } from "../../tipos/permisosAlumno";

export function useFormatosPermitidos(
  alumnoId: string | null | undefined,
): FormatoMultimediaAlumno[] | null {
  // Se guarda de qué alumno son, para no aplicar los de otro mientras llegan los nuevos.
  const [leidos, setLeidos] = useState<{
    alumnoId: string;
    formatos: FormatoMultimediaAlumno[] | null;
  } | null>(null);
  const real = Boolean(alumnoId && esIdDeAlumnoReal(alumnoId));

  useEffect(() => {
    if (!alumnoId || !real) return;
    let activo = true;
    obtenerPermisosAlumno26d(alumnoId, undefined, { forzarRemoto: true })
      .then((permisos) => {
        if (activo) setLeidos({ alumnoId, formatos: permisos.formatosPermitidos });
      })
      .catch(() => {
        if (activo) setLeidos({ alumnoId, formatos: null });
      });
    return () => {
      activo = false;
    };
  }, [alumnoId, real]);

  return real && leidos && leidos.alumnoId === alumnoId ? leidos.formatos : null;
}
