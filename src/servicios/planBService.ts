// Plan B contra Supabase (HU-22 · SCRUM-138): vincular a una tarea principal de hoy otra tarea ya
// creada y activarla. El vínculo va en asignaciones.plan_b_tarea_id; si no hay, vale el de la tarea.
// Los permisos los pone la base de datos: el tutor solo cambia las asignaciones de sus alumnos.
import { normalizarHora } from "../componentes/agenda/logica";
import { supabase } from "../lib/supabaseClient";
import type { DatosPlanB, FilaPlanB, RepositorioPlanB, TareaPlanB } from "../tipos/planB";

export const ERROR_SIN_PERMISO_PLAN_B = "No se ha podido cambiar el Plan B de esta tarea.";

interface FilaTarea {
  id: string;
  titulo: string;
  pictograma_url: string | null;
  hora_inicio: string | null;
  ambito: string | null;
  alumno_id: string | null;
  plan_b_tarea_id: string | null;
  activo: boolean | null;
}

interface FilaAsignacion {
  id: string;
  tarea_id: string;
  hora_inicio: string | null;
  estado: string;
  plan_b_activado: boolean | null;
  plan_b_tarea_id: string | null;
}

const aTarea = (t: FilaTarea): TareaPlanB => ({
  id: t.id,
  titulo: t.titulo,
  pictogramaUrl: t.pictograma_url,
});

/**
 * Tareas de clase de hoy sin terminar (47b: de un alumno; 47c: agrupadas por tarea y hora para
 * toda la clase) y la biblioteca de la que elegir el Plan B.
 */
export async function cargarPlanB(estudianteIds: string[], fecha: string): Promise<DatosPlanB> {
  const { data: datosTareas, error: errorTareas } = await supabase
    .from("tareas")
    .select("id, titulo, pictograma_url, hora_inicio, ambito, alumno_id, plan_b_tarea_id, activo")
    .order("titulo");
  if (errorTareas) throw errorTareas;
  const tareas = (datosTareas ?? []) as FilaTarea[];
  const porId = new Map(tareas.map((t) => [t.id, t]));

  // Del catálogo común y, si es un solo alumno, también las suyas.
  const unico = estudianteIds.length === 1 ? estudianteIds[0] : null;
  const biblioteca = tareas
    .filter((t) => t.activo !== false && t.ambito !== "hogar")
    .filter((t) => !t.alumno_id || t.alumno_id === unico)
    .map(aTarea);

  if (estudianteIds.length === 0) return { filas: [], biblioteca };

  const { data, error } = await supabase
    .from("asignaciones")
    .select("id, tarea_id, hora_inicio, estado, plan_b_activado, plan_b_tarea_id")
    .in("estudiante_id", estudianteIds)
    .eq("fecha", fecha)
    .neq("estado", "cancelada");
  if (error) throw error;

  const grupos = new Map<string, FilaPlanB>();
  for (const a of (data ?? []) as FilaAsignacion[]) {
    const tarea = porId.get(a.tarea_id);
    if (!tarea || tarea.ambito === "hogar") continue;
    if (a.estado === "hecho" || a.estado === "completada") continue;
    const hora = normalizarHora(a.hora_inicio ?? tarea.hora_inicio);
    const clave = `${a.tarea_id}@${hora}`;
    const idPlanB = a.plan_b_tarea_id ?? tarea.plan_b_tarea_id;
    const planB = idPlanB ? porId.get(idPlanB) : undefined;
    const activo = Boolean(a.plan_b_activado && planB);
    const grupo = grupos.get(clave);
    if (grupo) {
      grupo.asignacionIds.push(a.id);
      grupo.planB ??= planB ? aTarea(planB) : null;
      grupo.activo &&= activo;
    } else {
      grupos.set(clave, {
        clave,
        asignacionIds: [a.id],
        tareaId: a.tarea_id,
        titulo: tarea.titulo,
        pictogramaUrl: tarea.pictograma_url,
        hora,
        planB: planB ? aTarea(planB) : null,
        activo,
      });
    }
  }
  const filas = [...grupos.values()].sort(
    (a, b) => (a.hora || "99").localeCompare(b.hora || "99") || a.titulo.localeCompare(b.titulo),
  );
  return { filas, biblioteca };
}

/** Cambia las asignaciones pedidas y falla si la base de datos no deja cambiar alguna. */
async function cambiar(ids: string[], cambios: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase
    .from("asignaciones")
    .update(cambios)
    .in("id", ids)
    .select("id");
  if (error) throw error;
  if ((data as unknown[] | null)?.length !== ids.length) throw new Error(ERROR_SIN_PERMISO_PLAN_B);
}

export async function vincularPlanB(asignacionIds: string[], tareaPlanBId: string): Promise<void> {
  await cambiar(asignacionIds, { plan_b_tarea_id: tareaPlanBId });
}

/** Activar el Plan B de una tarea bloqueada además la devuelve a pendiente, para poder hacerla. */
export async function activarPlanB(asignacionIds: string[], activo: boolean): Promise<void> {
  await cambiar(asignacionIds, { plan_b_activado: activo });
  if (!activo) return;
  const { error } = await supabase
    .from("asignaciones")
    .update({ estado: "pendiente" })
    .in("id", asignacionIds)
    .eq("estado", "bloqueada");
  if (error) throw error;
}

export const repositorioPlanBSupabase: RepositorioPlanB = {
  cargar: cargarPlanB,
  vincular: vincularPlanB,
  activar: activarPlanB,
};
