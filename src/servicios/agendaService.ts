// Acceso a Supabase para la agenda del día del estudiante (T-06.2, HU-06).
// RF4.1: lee la secuencia del día con la función secuencia_dia (T-06.3, SCRUM-71).
// RF4.3: guarda la asignación como hecha.
// RF4.7: escucha los cambios del tutor con Supabase Realtime para actualizar sin recargar.
//
// Tablas del esquema (supabase/migrations): asignaciones (la entrada de agenda, RI4.1), tareas y
// pasos_tarea. Realtime se activa para ellas en 20261110100000_realtime_agenda.sql.
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
  return ((data ?? []) as EntradaAgenda[]).map((fila) => ({
    ...fila,
    hora_inicio: normalizarHora(fila.hora_inicio),
    tarea: { ...fila.tarea, pasos: fila.tarea?.pasos ?? [] },
  }));
}

/**
 * RF4.3: marca la asignación como hecha («hecho» en el esquema), salvo que el tutor la haya
 * bloqueado o cancelado justo antes.
 */
export async function marcarTareaHecha(idEntrada: string): Promise<void> {
  const { error } = await supabase
    .from("asignaciones")
    .update({ estado: "hecho" })
    .eq("id", idEntrada)
    .in("estado", ["pendiente", "en_curso"]);
  if (error) throw error;
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
  marcarHecha: marcarTareaHecha,
  suscribir: suscribirseAgenda,
};
