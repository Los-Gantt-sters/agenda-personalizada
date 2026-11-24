/**
 * Datos del panel de administración (pantalla 48, Consola integral): todos los usuarios del centro
 * (estudiantes, tutores, familias y administración) con su curso, sus aulas y sus vínculos, y las
 * listas de cursos y aulas para los filtros. Solo lee: cambiar cada cosa se hace en su pantalla.
 */

import { supabase } from "../lib/supabaseClient";
import type { AlumnosResult, DietaComedor } from "../tipos/alumnos";

export type RolPanel = "estudiante" | "tutor" | "familia" | "admin" | "especialista";

export interface UsuarioPanel {
  id: string;
  nombre: string;
  rol: RolPanel;
  email?: string;
  /** Años escolares de este usuario (p. ej. «2026-2027»). Vacío si no tiene curso. */
  cursos: string[];
  /** Estudiante: su aula. Tutor: las aulas que lleva. Familia: las aulas de sus hijos. */
  aulas: string[];
  /** Solo estudiantes. */
  tutor?: string;
  familia?: string;
  menu?: DietaComedor;
  /** Solo familias: los estudiantes con los que están vinculadas. */
  hijos?: { nombre: string; aula?: string }[];
}

export interface DatosPanel {
  usuarios: UsuarioPanel[];
  /** Todos los cursos que existen, para el filtro «Curso». */
  cursos: string[];
  /** Todas las aulas que existen, para el filtro «Aula». */
  aulas: string[];
}

export const ERROR_PANEL = "No se han podido cargar los usuarios. Inténtalo otra vez.";

const ROL_PANEL: Record<string, RolPanel> = {
  tutor_docente: "tutor",
  familiar: "familia",
  admin: "admin",
  especialista: "especialista",
};

const unicos = (xs: (string | undefined)[]) =>
  Array.from(new Set(xs.filter((x): x is string => Boolean(x))));

export async function listarUsuariosPanel(): Promise<AlumnosResult<DatosPanel>> {
  try {
    const [cursosR, aulasR, alumnosR, vinculosR, perfilesR] = await Promise.all([
      supabase
        .from("cursos_lectivos")
        .select("id, anio_escolar")
        .order("anio_escolar", { ascending: false }),
      supabase.from("aulas").select("id, nombre, curso_lectivo_id, tutor_titular_id, orden"),
      supabase
        .from("alumnos")
        .select("id, nombre, apellidos, dieta_comedor, aula_id, curso_lectivo_id")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("vinculos_alumno_supervisor")
        .select("alumno_id, supervisor_id, tipo_vinculo")
        .eq("activo", true),
      supabase
        .from("perfiles")
        .select("id, email, nombre_completo, rol")
        .eq("activo", true)
        .neq("rol", "estudiante")
        .order("nombre_completo", { ascending: true }),
    ]);
    const fallo = [cursosR, aulasR, alumnosR, vinculosR, perfilesR].find((r) => r.error);
    if (fallo?.error) return { success: false, error: fallo.error.message };

    const cursoPorId = new Map<string, string>(
      (cursosR.data || []).map((c: any) => [c.id, c.anio_escolar]),
    );
    const aulas: any[] = [...(aulasR.data || [])].sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(b.nombre),
    );
    const aulaPorId = new Map<string, any>(aulas.map((a) => [a.id, a]));
    const vinculos: any[] = vinculosR.data || [];
    const perfiles: any[] = perfilesR.data || [];
    const nombrePerfil = new Map<string, string>(perfiles.map((p) => [p.id, p.nombre_completo]));

    const nombreAlumno = (a: any) => [a.nombre, a.apellidos].filter(Boolean).join(" ");
    const cursoDeAlumno = (a: any) =>
      cursoPorId.get(a.curso_lectivo_id) ??
      cursoPorId.get(aulaPorId.get(a.aula_id)?.curso_lectivo_id);

    const estudiantes: UsuarioPanel[] = (alumnosR.data || []).map((a: any) => {
      const aula = aulaPorId.get(a.aula_id);
      const de = (tipo: string) => {
        const v = vinculos.find((x) => x.alumno_id === a.id && x.tipo_vinculo === tipo);
        return v ? nombrePerfil.get(v.supervisor_id) : undefined;
      };
      return {
        id: a.id,
        nombre: nombreAlumno(a),
        rol: "estudiante",
        cursos: unicos([cursoDeAlumno(a)]),
        aulas: unicos([aula?.nombre]),
        tutor: de("aula"),
        familia: de("familiar"),
        menu: a.dieta_comedor,
      };
    });

    const alumnosDe = (perfilId: string) =>
      (alumnosR.data || []).filter((a: any) =>
        vinculos.some((v) => v.supervisor_id === perfilId && v.alumno_id === a.id),
      );

    const adultos: UsuarioPanel[] = perfiles.map((p) => {
      const rol = ROL_PANEL[p.rol] ?? "especialista";
      const hijos = alumnosDe(p.id);
      const aulasPropias = aulas.filter((a) => a.tutor_titular_id === p.id);
      const aulasDeHijos = hijos.map((h: any) => aulaPorId.get(h.aula_id));
      const todasLasAulas = rol === "tutor" ? [...aulasPropias, ...aulasDeHijos] : aulasDeHijos;
      const cursos =
        rol === "admin"
          ? []
          : unicos([
              ...todasLasAulas.map((a) => cursoPorId.get(a?.curso_lectivo_id)),
              ...hijos.map((h: any) => cursoDeAlumno(h)),
            ]);
      return {
        id: p.id,
        nombre: p.nombre_completo,
        rol,
        email: p.email,
        cursos,
        aulas: unicos(todasLasAulas.map((a) => a?.nombre)),
        hijos:
          rol === "familia"
            ? hijos.map((h: any) => ({
                nombre: nombreAlumno(h),
                aula: aulaPorId.get(h.aula_id)?.nombre,
              }))
            : undefined,
      };
    });

    return {
      success: true,
      data: {
        usuarios: [...estudiantes, ...adultos],
        cursos: (cursosR.data || []).map((c: any) => c.anio_escolar),
        aulas: unicos(aulas.map((a) => a.nombre)),
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : ERROR_PANEL };
  }
}
