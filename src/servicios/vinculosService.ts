/**
 * Asignación de tutores de aula y familias a los estudiantes (HU-03 / SCRUM-61).
 * Lo usa la consola de administración. Alineado con RF2.4, RF2.5 y RI2.4.
 * Regla del esquema: como máximo un tutor familiar activo por estudiante (uq_alumno_un_familiar_activo).
 */

import { supabase } from "../lib/supabaseClient";
import { AlumnosResult, TipoVinculo } from "../tipos/alumnos";

export const ERROR_TUTOR_AULA_OBLIGATORIO = "Cada estudiante tiene que tener un tutor de aula.";
export const ERROR_ASIGNAR_VINCULO = "No se ha podido guardar el cambio. Inténtalo otra vez.";

/** Rol de quien puede vincularse con un estudiante, según el tipo de vínculo. */
const ROL_POR_VINCULO: Record<TipoVinculo, "tutor_docente" | "familiar"> = {
  aula: "tutor_docente",
  familiar: "familiar",
};

export interface Supervisor {
  id: string;
  nombre: string;
}

export interface AlumnoConVinculos {
  id: string;
  nombre: string;
  apellidos?: string;
  aula?: string;
  /** RF2.5: se muestra como distintivo en los listados. */
  requiereTutorPresencial: boolean;
  tutorAula: Supervisor | null;
  familia: Supervisor | null;
}

/** Estudiantes activos con su aula, su tutor de aula y su familia. */
export async function listarAlumnosConVinculos(): Promise<AlumnosResult<AlumnoConVinculos[]>> {
  try {
    const { data: alumnos, error: errorAlumnos } = await supabase
      .from("alumnos")
      .select("id, nombre, apellidos, requiere_tutor_presencial, aulas(nombre)")
      .eq("activo", true)
      .order("nombre", { ascending: true });
    if (errorAlumnos) return { success: false, error: errorAlumnos.message };

    const { data: vinculos, error: errorVinculos } = await supabase
      .from("vinculos_alumno_supervisor")
      .select("alumno_id, tipo_vinculo, perfiles(id, nombre_completo)")
      .eq("activo", true);
    if (errorVinculos) return { success: false, error: errorVinculos.message };

    const supervisorDe = (alumnoId: string, tipo: TipoVinculo): Supervisor | null => {
      const v: any = (vinculos || []).find(
        (x: any) => x.alumno_id === alumnoId && x.tipo_vinculo === tipo,
      );
      // Sin tipos generados, Supabase puede devolver la relación como objeto o como lista de uno
      const perfil = Array.isArray(v?.perfiles) ? v.perfiles[0] : v?.perfiles;
      return perfil ? { id: perfil.id, nombre: perfil.nombre_completo } : null;
    };

    return {
      success: true,
      data: (alumnos || []).map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        apellidos: a.apellidos ?? undefined,
        aula: (Array.isArray(a.aulas) ? a.aulas[0] : a.aulas)?.nombre,
        requiereTutorPresencial: Boolean(a.requiere_tutor_presencial),
        tutorAula: supervisorDe(a.id, "aula"),
        familia: supervisorDe(a.id, "familiar"),
      })),
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : ERROR_ASIGNAR_VINCULO };
  }
}

/** Tutores de aula o familias activos, para los selectores de la consola. */
export async function listarSupervisores(tipo: TipoVinculo): Promise<AlumnosResult<Supervisor[]>> {
  try {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, nombre_completo")
      .eq("rol", ROL_POR_VINCULO[tipo])
      .eq("activo", true)
      .order("nombre_completo", { ascending: true });
    if (error) return { success: false, error: error.message };

    return {
      success: true,
      data: (data || []).map((p: any) => ({ id: p.id, nombre: p.nombre_completo })),
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : ERROR_ASIGNAR_VINCULO };
  }
}

/**
 * Cambia el tutor de aula o la familia de un estudiante. Desactiva el vínculo activo de ese tipo
 * y activa el nuevo (o lo reactiva si ya existió). Con `supervisorId = null` deja al estudiante sin
 * familia; sin tutor de aula no puede quedarse. Si falla el segundo paso, se restaura el vínculo
 * anterior para que el estudiante no se quede sin nadie.
 * Mejora pendiente: hacerlo en una sola transacción con una función RPC de Supabase.
 */
export async function asignarSupervisor(
  alumnoId: string,
  tipo: TipoVinculo,
  supervisorId: string | null,
): Promise<AlumnosResult<null>> {
  if (tipo === "aula" && !supervisorId) {
    return { success: false, error: ERROR_TUTOR_AULA_OBLIGATORIO };
  }

  try {
    const { data: anteriores, error: errorDesactivar } = await supabase
      .from("vinculos_alumno_supervisor")
      .update({ activo: false })
      .eq("alumno_id", alumnoId)
      .eq("tipo_vinculo", tipo)
      .eq("activo", true)
      .select("supervisor_id");
    if (errorDesactivar) return { success: false, error: ERROR_ASIGNAR_VINCULO };

    if (!supervisorId) return { success: true, data: null };

    const { error: errorActivar } = await supabase
      .from("vinculos_alumno_supervisor")
      .upsert(
        { alumno_id: alumnoId, supervisor_id: supervisorId, tipo_vinculo: tipo, activo: true },
        { onConflict: "alumno_id,supervisor_id" },
      );

    if (errorActivar) {
      const anterior = (anteriores || [])[0]?.supervisor_id;
      if (anterior) {
        await supabase
          .from("vinculos_alumno_supervisor")
          .update({ activo: true })
          .eq("alumno_id", alumnoId)
          .eq("supervisor_id", anterior);
      }
      return { success: false, error: ERROR_ASIGNAR_VINCULO };
    }

    return { success: true, data: null };
  } catch {
    return { success: false, error: ERROR_ASIGNAR_VINCULO };
  }
}
