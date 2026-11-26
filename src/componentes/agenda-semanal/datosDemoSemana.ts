// Semana de ejemplo para la agenda semanal (SCRUM-124 · T-17.1, MOD HU-17) sin Supabase.
// Hoy es la agenda de ejemplo de siempre (agendaDemo); los demás días llevan algunas de esas
// tareas con otros ids. Los días que ya han pasado salen hechos. El fin de semana hay menos tareas
// y son de casa.
import type { EntradaAgenda } from "../agenda/tipos";
import { agendaDemo } from "../agenda/datosDemo";
import { urlImagenPictograma } from "../../arasaac/urls";
import { diaDeLaSemana, diasDeLaSemana, lunesDe } from "./semana";

/** Cuántas tareas hay cada día de lunes a domingo (como en el boceto 06b). */
const TAREAS_POR_DIA = [5, 4, 5, 5, 4, 3, 2];

/** Tareas de casa del fin de semana. */
const FIN_DE_SEMANA: { titulo: string; emoji: string; picto: number; hora: string }[] = [
  { titulo: "Hacer la cama", emoji: "🛏️", picto: 5481, hora: "10:00" },
  { titulo: "Pasear con mi familia", emoji: "🚶", picto: 29951, hora: "12:00" },
  { titulo: "Poner la mesa", emoji: "🍽️", picto: 5549, hora: "14:00" },
];

export function agendaDemoSemana(hoy: string): EntradaAgenda[] {
  const base = agendaDemo(hoy);
  return diasDeLaSemana(lunesDe(hoy)).flatMap((fecha, i) => {
    if (fecha === hoy) return base;
    const pasado = fecha < hoy;
    const estado: EntradaAgenda["estado"] = pasado ? "hecha" : "pendiente";
    if (diaDeLaSemana(fecha) >= 5) {
      return FIN_DE_SEMANA.slice(0, TAREAS_POR_DIA[i]).map((t, j) => ({
        id: `${fecha}-c${j + 1}`,
        estudiante_id: base[0].estudiante_id,
        tarea_id: `casa-${j + 1}`,
        fecha,
        hora_inicio: t.hora,
        duracion_prevista_min: 45,
        orden: j + 1,
        estado,
        requiere_inicio_fin: true,
        tarea: {
          id: `casa-${j + 1}`,
          titulo: t.titulo,
          emoji: t.emoji,
          pictograma_url: urlImagenPictograma(t.picto, 500),
        },
      }));
    }
    // De lunes a viernes, las tareas del colegio empezando por una distinta cada día.
    const giradas = [...base.slice(i % base.length), ...base.slice(0, i % base.length)];
    return giradas.slice(0, TAREAS_POR_DIA[i]).map((e, j) => ({
      ...e,
      id: `${fecha}-${e.id}`,
      fecha,
      hora_inicio: base[j].hora_inicio,
      orden: j + 1,
      estado,
      inicio_real: null,
      fin_real: null,
      pendiente_motivo: null,
    }));
  });
}
