// Datos de ejemplo de la agenda del día (T-06.1, HU-06). Se usan en app/agenda.tsx hasta que la
// agenda se cargue desde Supabase (T-06.2). Los pictogramas son emojis; con datos reales,
// pictograma_url apunta a ARASAAC o a una foto.
import type { EntradaAgenda, Tarea } from "./tipos";

const T = (id: string, titulo: string, emoji: string, extra: Partial<Tarea> = {}): Tarea => ({
  id,
  titulo,
  emoji,
  pictograma_url: null,
  ...extra,
});

export const ESTUDIANTE_DEMO = "demo-alejandro";

export function agendaDemo(fecha: string): EntradaAgenda[] {
  const tareas: [string, number, Tarea, EntradaAgenda["estado"]][] = [
    [
      "09:00",
      30,
      T("t1", "Asamblea", "🗣️", {
        descripcion: "Nos sentamos en círculo. Decimos qué día es hoy.",
      }),
      "hecha",
    ],
    [
      "09:30",
      45,
      T("t2", "Lavarse las manos", "🧼", {
        descripcion: "Antes del desayuno nos lavamos las manos.",
        pasos: [
          { orden: 1, texto: "Abre el grifo." },
          { orden: 2, texto: "Pon jabón en las manos." },
          { orden: 3, texto: "Frota las manos." },
          { orden: 4, texto: "Aclara y seca las manos." },
        ],
      }),
      "pendiente",
    ],
    [
      "10:15",
      30,
      T("t3", "Desayuno", "🥪", { descripcion: "Tomamos el desayuno en clase." }),
      "pendiente",
    ],
    [
      "10:45",
      45,
      T("t4", "Reprografía", "🖨️", {
        descripcion: "Hacemos las fotocopias que nos pide la tutora.",
      }),
      "pendiente",
    ],
    ["11:30", 30, T("t5", "Recreo", "⚽", { descripcion: "Salimos al patio." }), "pendiente"],
    ["12:00", 60, T("t6", "Taller de cocina", "🍳"), "pendiente"],
  ];
  return tareas.map(([hora, dur, tarea, estado], i) => ({
    id: `e${i + 1}`,
    estudiante_id: ESTUDIANTE_DEMO,
    tarea_id: tarea.id,
    fecha,
    hora_inicio: hora,
    duracion_prevista_min: dur,
    orden: i + 1,
    estado,
    tarea,
  }));
}
