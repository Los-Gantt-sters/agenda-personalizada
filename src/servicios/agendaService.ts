// Acceso a Supabase para la agenda del día del estudiante (T-06.2, HU-06).
// RF4.1: lee la secuencia del día con la función secuencia_dia (T-06.3, SCRUM-71).
// RF4.3: guarda la asignación como hecha.
// RF4.7: escucha los cambios del tutor con Supabase Realtime para actualizar sin recargar.
// T-08.1 (HU-08): RF6.1 «Empezar» pone la entrada en curso y RF6.4 «Terminar» la cierra, guardando
// las horas reales (RI6.1).
//
// Tablas del esquema (supabase/migrations): asignaciones (la entrada de agenda, RI4.1), tareas y
// pasos_tarea. Realtime se activa para ellas en 20261110100000_realtime_agenda.sql.
// HU-08: las horas reales de «Empezar» y «Terminar» (RI6.1) se guardan en ejecuciones (SCRUM-76).
import { supabase } from "../lib/supabaseClient";
import type { EntradaAgenda, RepositorioAgenda } from "../componentes/agenda/tipos";
import { normalizarHora } from "../componentes/agenda/logica";

/** RF4.1: entradas del día del estudiante, ya en orden cronológico y sin las canceladas. */
export async function obtenerSecuenciaDia(
  estudianteId: string,
  fecha: string,
): Promise<EntradaAgenda[]> {
  const { data, error } = await supabase.rpc("secuencia_dia", {
    p_estudiante: estudianteId,
    p_fecha: fecha,
  });
  if (error) throw error;
  const filas = (data ?? []) as EntradaAgenda[];
  const marcas = await obtenerMarcasTiempo(filas.map((f) => f.id));
  return filas.map((fila) => ({
    ...fila,
    hora_inicio: normalizarHora(fila.hora_inicio),
    tarea: { ...fila.tarea, pasos: fila.tarea?.pasos ?? [] },
    // RI6.1: la hora real de inicio y de fin está en ejecuciones (secuencia_dia no la trae). Sin
    // ella, al recargar después de «Empezar» se perderían el reloj y «Empezaste a las...».
    inicio_real: fila.inicio_real ?? marcas.get(fila.id)?.inicio ?? null,
    fin_real: fila.fin_real ?? marcas.get(fila.id)?.fin ?? null,
  }));
}

/**
 * Horas reales de inicio y fin (RI6.1) de las asignaciones del día. Si no se pueden leer, la agenda
 * se enseña igual, solo que sin esas horas.
 */
async function obtenerMarcasTiempo(
  ids: string[],
): Promise<Map<string, { inicio: string | null; fin: string | null }>> {
  const marcas = new Map<string, { inicio: string | null; fin: string | null }>();
  if (ids.length === 0) return marcas;
  try {
    const { data, error } = await supabase
      .from("ejecuciones")
      .select("asignacion_id, inicio, fin")
      .in("asignacion_id", ids);
    if (error) return marcas;
    for (const m of (data ?? []) as {
      asignacion_id: string;
      inicio: string | null;
      fin: string | null;
    }[])
      marcas.set(m.asignacion_id, { inicio: m.inicio, fin: m.fin });
  } catch {
    // Sin las horas reales la agenda sigue funcionando.
  }
  return marcas;
}

/**
 * RF6.1: pone la asignación en curso, solo si seguía pendiente, y guarda la hora real de inicio
 * en ejecuciones (RI6.1, SCRUM-76).
 */
export async function marcarTareaEnCurso(idEntrada: string, inicio: string): Promise<void> {
  const { data, error } = await supabase
    .from("asignaciones")
    .update({ estado: "en_curso" })
    .eq("id", idEntrada)
    .eq("estado", "pendiente")
    .select("estudiante_id");
  if (error) throw error;
  const fila = (data as { estudiante_id: string }[] | null)?.[0];
  if (!fila) return; // ya no estaba pendiente (el tutor la cambió o se pulsó dos veces)
  const { error: errorEjecucion } = await supabase
    .from("ejecuciones")
    .upsert(
      { asignacion_id: idEntrada, estudiante_id: fila.estudiante_id, inicio },
      { onConflict: "asignacion_id" },
    );
  if (errorEjecucion) throw errorEjecucion;
}

/**
 * RF4.3 y RF6.4: marca la asignación como hecha («hecho» en el esquema), salvo que el tutor la
 * haya bloqueado o cancelado justo antes, y guarda la hora real de fin en ejecuciones (RI6.1).
 */
export async function marcarTareaHecha(
  idEntrada: string,
  fin: string = new Date().toISOString(),
): Promise<void> {
  const { data, error } = await supabase
    .from("asignaciones")
    .update({ estado: "hecho" })
    .eq("id", idEntrada)
    .in("estado", ["pendiente", "en_curso"])
    .select("id");
  if (error) throw error;
  if (!(data as unknown[] | null)?.length) return;
  // Solo hay ejecución si la tarea se empezó con «Empezar»; si no, este update no cambia nada.
  const { error: errorEjecucion } = await supabase
    .from("ejecuciones")
    .update({ fin })
    .eq("asignacion_id", idEntrada);
  if (errorEjecucion) throw errorEjecucion;
}

/**
 * «Atrás» tras «Empezar» (mejora de la profesora, noviembre de 2026): la asignación en curso vuelve
 * a pendiente y se borra su ejecución, porque la hora de inicio es obligatoria en ejecuciones.
 */
export async function desmarcarTareaEnCurso(idEntrada: string): Promise<void> {
  const { data, error } = await supabase
    .from("asignaciones")
    .update({ estado: "pendiente" })
    .eq("id", idEntrada)
    .eq("estado", "en_curso")
    .select("id");
  if (error) throw error;
  if (!(data as unknown[] | null)?.length) return; // ya no estaba en curso
  const { error: errorEjecucion } = await supabase
    .from("ejecuciones")
    .delete()
    .eq("asignacion_id", idEntrada);
  if (errorEjecucion) throw errorEjecucion;
}

/**
 * «Atrás» tras «Terminar» (mejora de la profesora, noviembre de 2026): la asignación hecha vuelve a
 * en curso (si se había empezado) o a pendiente, y se borra la hora de fin.
 */
export async function desmarcarTareaHecha(
  idEntrada: string,
  volverA: "pendiente" | "en_curso",
): Promise<void> {
  const { data, error } = await supabase
    .from("asignaciones")
    .update({ estado: volverA })
    .eq("id", idEntrada)
    .eq("estado", "hecho")
    .select("id");
  if (error) throw error;
  if (!(data as unknown[] | null)?.length) return; // ya no estaba hecha
  const { error: errorEjecucion } = await supabase
    .from("ejecuciones")
    .update({ fin: null })
    .eq("asignacion_id", idEntrada);
  if (errorEjecucion) throw errorEjecucion;
}

/** RF4.7: suscripción Realtime a la agenda del estudiante. Devuelve la función para darse de baja. */
export function suscribirseAgenda(
  estudianteId: string,
  fecha: string,
  alCambiar: () => void,
  idsVisibles: () => ReadonlySet<string>,
): () => void {
  const filtro = `estudiante_id=eq.${estudianteId}`;
  const enPantalla = (clave: string | undefined) => !!clave && idsVisibles().has(clave);
  const canal = supabase
    .channel(`agenda:${estudianteId}:${fecha}`)
    // Altas y cambios de asignaciones de este estudiante (crear, modificar, bloquear, cancelar).
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "asignaciones", filter: filtro },
      alCambiar,
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "asignaciones", filter: filtro },
      alCambiar,
    )
    // Realtime no deja filtrar los DELETE: se comprueba si la fila borrada estaba en pantalla.
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "asignaciones" }, (p) => {
      if (enPantalla((p.old as { id?: string } | null)?.id)) alCambiar();
    })
    // El tutor cambia el título, el pictograma o desactiva una tarea que está en la agenda.
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tareas" }, (p) => {
      const id = (p.new as { id?: string } | null)?.id;
      if (enPantalla(id && `tarea:${id}`)) alCambiar();
    })
    // El tutor cambia los pasos de una tarea que está en la agenda.
    .on("postgres_changes", { event: "*", schema: "public", table: "pasos_tarea" }, (p) => {
      const fila = (p.new ?? p.old) as { tarea_id?: string } | null;
      if (enPantalla(fila?.tarea_id && `tarea:${fila.tarea_id}`)) alCambiar();
    })
    .subscribe((estado) => {
      // Al (re)conectar se recarga, por si hubo cambios mientras la tableta estaba sin conexión.
      if (estado === "SUBSCRIBED") alCambiar();
    });

  return () => {
    supabase.removeChannel(canal);
  };
}

/** Repositorio de la agenda contra Supabase, para pasárselo a la pantalla. */
export const repositorioAgendaSupabase: RepositorioAgenda = {
  obtenerSecuenciaDia,
  marcarEnCurso: marcarTareaEnCurso,
  marcarHecha: marcarTareaHecha,
  desmarcarEnCurso: desmarcarTareaEnCurso,
  desmarcarHecha: desmarcarTareaHecha,
  suscribir: suscribirseAgenda,
};
