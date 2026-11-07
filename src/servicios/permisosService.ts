/**
 * Servicio de Segregación de Permisos por Ámbito y Cumplimiento RGPD (SCRUM-62 / T-03.4)
 *
 * Directrices RGPD implementadas:
 * 1. Principio de minimización y limitación de acceso (RGPD Art. 5.1.c):
 *    - Familiar: Acceso estrictamente restringido a su propio hijo vinculado. Bloqueo total a otros alumnos.
 *    - Tutor docente: Acceso restringido a los alumnos de su aula asignada o con vínculo escolar activo.
 *    - Admin: Acceso a nivel de centro educativo.
 *
 * 2. Segregación estricta por ámbito de actuación (Escolar / "centro" vs Doméstico / "hogar"):
 *    - Tareas de centro: Creadas y gestionadas exclusivamente por tutores docentes o administradores.
 *      Los familiares pueden consultarlas en modo lectura para seguimiento pero no pueden alterarlas.
 *    - Tareas de hogar: Creadas y gestionadas exclusivamente por familiares o administradores.
 *      Los tutores docentes pueden consultarlas en modo lectura para coordinación pero no intervenir en el ámbito privado del hogar.
 */

import { supabase } from "../lib/supabaseClient";
import { AmbitoActuacion, Alumno } from "../tipos/alumnos";
import { SupervisorRole, SupervisorProfile } from "../tipos/auth";
import { Tarea } from "../tipos/tareas";
import {
  AccionPermiso,
  PermisoCheckResult,
  ERROR_PERMISO_DENEGADO,
  ERROR_AMBITO_RESTRINGIDO,
  ERROR_ALUMNO_NO_VINCULADO,
  ERROR_ROL_NO_AUTORIZADO,
  ERROR_USUARIO_INVALIDO,
} from "../tipos/permisos";

/**
 * Comprueba si un usuario es tutor docente asignado al estudiante
 * (por vínculo explícito de tipo 'aula' o por coincidencia de aula).
 */
export async function esTutorDocenteDeAlumno(
  supervisorId: string,
  alumnoId: string,
): Promise<boolean> {
  if (!supervisorId || !alumnoId) return false;

  try {
    // 1. Comprobar vínculo explícito en vinculos_alumno_supervisor
    const { data: vinculo, error: errorVinculo } = await supabase
      .from("vinculos_alumno_supervisor")
      .select("id")
      .eq("supervisor_id", supervisorId)
      .eq("alumno_id", alumnoId)
      .eq("tipo_vinculo", "aula")
      .eq("activo", true)
      .maybeSingle();

    if (!errorVinculo && vinculo) {
      return true;
    }

    // 2. Comprobar si el tutor docente tiene asignada el aula del alumno
    const { data: tutorDocente, error: errorDocente } = await supabase
      .from("tutores_docentes")
      .select("aula_id")
      .eq("id", supervisorId)
      .maybeSingle();

    if (errorDocente || !tutorDocente?.aula_id) {
      return false;
    }

    const { data: alumno, error: errorAlumno } = await supabase
      .from("alumnos")
      .select("aula_id")
      .eq("id", alumnoId)
      .maybeSingle();

    if (errorAlumno || !alumno?.aula_id) {
      return false;
    }

    return tutorDocente.aula_id === alumno.aula_id;
  } catch {
    return false;
  }
}

/**
 * Comprueba si un usuario es el familiar / tutor legal vinculado al estudiante.
 */
export async function esFamiliarDeAlumno(supervisorId: string, alumnoId: string): Promise<boolean> {
  if (!supervisorId || !alumnoId) return false;

  try {
    const { data: vinculo, error } = await supabase
      .from("vinculos_alumno_supervisor")
      .select("id")
      .eq("supervisor_id", supervisorId)
      .eq("alumno_id", alumnoId)
      .eq("tipo_vinculo", "familiar")
      .eq("activo", true)
      .maybeSingle();

    if (error || !vinculo) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Valida el acceso general a los datos de un alumno (RGPD Art. 5.1.c).
 * Garantiza que familiares no puedan acceder jamás a expedientes ajenos.
 */
export async function validarAccesoAlumno(
  usuario: SupervisorProfile,
  alumnoId: string,
): Promise<PermisoCheckResult> {
  if (!usuario || !usuario.id || !alumnoId) {
    return {
      permitido: false,
      codigoError: ERROR_USUARIO_INVALIDO,
      motivo: "Identificador de usuario o de alumno no proporcionado.",
    };
  }

  // Administrador: Acceso total al centro
  if (usuario.role === "admin") {
    return { permitido: true };
  }

  // Familiar: Solo puede acceder a su propio hijo con vínculo activo
  if (usuario.role === "familiar") {
    const vinculado = await esFamiliarDeAlumno(usuario.id, alumnoId);
    if (!vinculado) {
      return {
        permitido: false,
        codigoError: ERROR_ALUMNO_NO_VINCULADO,
        motivo:
          "Principio RGPD: El familiar solo puede consultar los datos de su propio hijo vinculado.",
      };
    }
    return { permitido: true };
  }

  // Tutor docente / especialista: Acceso a los alumnos de su aula o con vínculo activo
  if (usuario.role === "tutor_docente" || usuario.role === "especialista") {
    const esDocente = await esTutorDocenteDeAlumno(usuario.id, alumnoId);
    if (!esDocente) {
      return {
        permitido: false,
        codigoError: ERROR_ALUMNO_NO_VINCULADO,
        motivo: "El docente no tiene asignado este estudiante ni su aula escolar.",
      };
    }
    return { permitido: true };
  }

  return {
    permitido: false,
    codigoError: ERROR_ROL_NO_AUTORIZADO,
    motivo: ERROR_PERMISO_DENEGADO,
  };
}

/**
 * Determina si un rol tiene permiso para modificar (crear/editar/borrar) en un ámbito dado.
 */
export function puedeModificarAmbito(rol: SupervisorRole, ambito: AmbitoActuacion): boolean {
  if (rol === "admin") return true;
  if (rol === "tutor_docente" || rol === "especialista") return ambito === "centro";
  if (rol === "familiar") return ambito === "hogar";
  return false;
}

/**
 * Retorna los ámbitos en los que el usuario tiene permisos de modificación / escritura.
 */
export function obtenerAmbitosEscritura(rol: SupervisorRole): AmbitoActuacion[] {
  if (rol === "admin") return ["centro", "hogar"];
  if (rol === "tutor_docente" || rol === "especialista") return ["centro"];
  if (rol === "familiar") return ["hogar"];
  return [];
}

/**
 * Retorna los ámbitos en los que el usuario tiene permisos de consulta / lectura.
 */
export function obtenerAmbitosLectura(rol: SupervisorRole): AmbitoActuacion[] {
  if (rol === "admin" || rol === "tutor_docente" || rol === "especialista" || rol === "familiar") {
    return ["centro", "hogar"];
  }
  return [];
}

/**
 * Valida la autorización para operar sobre una tarea según el ámbito (centro vs hogar) y la acción.
 * Segrega estrictamente los permisos según el rol y el ámbito de actuación.
 */
export async function validarAccesoTarea(
  usuario: SupervisorProfile,
  alumnoId: string,
  ambitoTarea: AmbitoActuacion,
  accion: AccionPermiso,
): Promise<PermisoCheckResult> {
  // 1. Validar primero que el usuario tenga acceso legítimo al alumno
  const checkAlumno = await validarAccesoAlumno(usuario, alumnoId);
  if (!checkAlumno.permitido) {
    return checkAlumno;
  }

  // 2. Administrador tiene acceso total a todos los ámbitos y acciones
  if (usuario.role === "admin") {
    return { permitido: true };
  }

  // 3. Lectura: Tanto el tutor escolar como la familia pueden ver la agenda completa
  // (coordinación escuela-hogar)
  if (accion === "leer") {
    return { permitido: true };
  }

  // 4. Acciones de modificación (crear, actualizar, eliminar):
  // Segregación estricta por ámbito escolar vs doméstico
  if (ambitoTarea === "centro") {
    if (usuario.role === "tutor_docente" || usuario.role === "especialista") {
      return { permitido: true };
    }
    return {
      permitido: false,
      codigoError: ERROR_AMBITO_RESTRINGIDO,
      motivo: "Los familiares no pueden crear, modificar ni eliminar tareas del ámbito escolar.",
    };
  }

  if (ambitoTarea === "hogar") {
    if (usuario.role === "familiar") {
      return { permitido: true };
    }
    return {
      permitido: false,
      codigoError: ERROR_AMBITO_RESTRINGIDO,
      motivo:
        "Los tutores docentes no pueden crear, modificar ni eliminar tareas del ámbito doméstico del hogar.",
    };
  }

  return {
    permitido: false,
    codigoError: ERROR_ROL_NO_AUTORIZADO,
    motivo: ERROR_PERMISO_DENEGADO,
  };
}

/**
 * Filtra una lista de alumnos garantizando el cumplimiento del RGPD:
 * Un familiar solo recibirá su propio hijo; un tutor solo los alumnos de su aula.
 */
export async function filtrarAlumnosPorPermiso(
  usuario: SupervisorProfile,
  alumnos: Alumno[],
): Promise<Alumno[]> {
  if (!usuario || !Array.isArray(alumnos) || alumnos.length === 0) {
    return [];
  }

  if (usuario.role === "admin") {
    return alumnos;
  }

  const accesibles: Alumno[] = [];
  for (const alumno of alumnos) {
    const check = await validarAccesoAlumno(usuario, alumno.id);
    if (check.permitido) {
      accesibles.push(alumno);
    }
  }

  return accesibles;
}

/**
 * Filtra tareas de un alumno según la visibilidad y permisos del usuario.
 */
export async function filtrarTareasPorAmbito(
  usuario: SupervisorProfile,
  tareas: Tarea[],
  alumnoId: string,
): Promise<Tarea[]> {
  const checkAlumno = await validarAccesoAlumno(usuario, alumnoId);
  if (!checkAlumno.permitido) {
    return [];
  }

  if (!Array.isArray(tareas) || tareas.length === 0) {
    return [];
  }

  const ambitosLectura = obtenerAmbitosLectura(usuario.role);
  return tareas.filter((t) => ambitosLectura.includes(t.ambito));
}
