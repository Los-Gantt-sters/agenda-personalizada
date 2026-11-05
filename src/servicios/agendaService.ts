// Acceso a Supabase para la agenda del día del estudiante (T-06.2, HU-06).
// RF4.1: lee la secuencia del día. RF4.3: guarda la tarea como hecha.
// RF4.7: escucha los cambios del tutor con Supabase Realtime para actualizar sin recargar.
//
// Necesita en Supabase (esquema de SCRUM-156 / endpoint de T-06.3):
//   - tablas entrada_agenda (RI4.1) y tarea, con la relación entrada_agenda.tarea_id → tarea.id
//   - alter publication supabase_realtime add table entrada_agenda, tarea;
//   - alter table entrada_agenda replica identity full;  (para que los DELETE traigan el id)
import { supabase } from "../lib/supabaseClient";
import type { EntradaAgenda, RepositorioAgenda } from "../componentes/agenda/tipos";
import { normalizarHora } from "../componentes/agenda/logica";

const COLUMNAS =
  "id, estudiante_id, tarea_id, fecha, hora_inicio, duracion_prevista_min, orden, estado, " +
  "tarea:tarea ( id, titulo, pictograma_url, descripcion, audio_url, video_url, pasos )";

/** RF4.1: entradas del día del estudiante, sin las canceladas. */
export async function obtenerSecuenciaDia(
  estudianteId: string,
  fecha: string,
): Promise<EntradaAgenda[]> {
  // TODO(T-06.3): cambiar por el endpoint de Jaime cuando esté, p. ej.
  //   supabase.rpc("secuencia_dia", { p_estudiante: estudianteId, p_fecha: fecha })
  const { data, error } = await supabase
    .from("entrada_agenda")
    .select(COLUMNAS)
    .eq("estudiante_id", estudianteId)
    .eq("fecha", fecha)
    .neq("estado", "cancelada")
    .order("hora_inicio")
    .order("orden");
  if (error) throw error;
  return (data ?? []).map((fila: any) => ({
    ...fila,
    hora_inicio: normalizarHora(fila.hora_inicio),
    tarea: Array.isArray(fila.tarea) ? fila.tarea[0] : fila.tarea,
  })) as EntradaAgenda[];
}

/** RF4.3: marca la entrada como hecha, salvo que el tutor la haya bloqueado o cancelado antes. */
export async function marcarTareaHecha(idEntrada: string): Promise<void> {
  const { error } = await supabase
    .from("entrada_agenda")
    .update({ estado: "hecha" })
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
  const canal = supabase
    .channel(`agenda:${estudianteId}:${fecha}`)
    // Altas y cambios de entradas de este estudiante.
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "entrada_agenda", filter: filtro },
      alCambiar,
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "entrada_agenda", filter: filtro },
      alCambiar,
    )
    // Realtime no deja filtrar los DELETE: se comprueba si la fila borrada estaba en pantalla.
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "entrada_agenda" }, (p) => {
      const id = (p.old as { id?: string } | null)?.id;
      if (id && idsVisibles().has(id)) alCambiar();
    })
    // El tutor cambia el título, el pictograma o los pasos de una tarea que está en la agenda.
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tarea" }, (p) => {
      const id = (p.new as { id?: string } | null)?.id;
      if (id && idsVisibles().has(`tarea:${id}`)) alCambiar();
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
