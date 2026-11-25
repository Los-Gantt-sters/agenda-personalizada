// Datos de ejemplo de la agenda del día (T-06.1, HU-06). Se usan en app/agenda.tsx hasta que la
// agenda se cargue desde Supabase (T-06.2). Los pictogramas son de ARASAAC; el emoji solo se ve si la
// imagen no carga (sin conexión).
// HU-08: todas las tareas piden pulsar «Empezar» antes de «Terminar» (lo normal, RF6.8).
// HU-16: agendaDemoAviso mueve las horas para probar el aviso de 5 minutos sin esperar.
// HU-10: «Lavarse las manos» tiene pasos: «Empezar» abre la 07 y «Mostrar pasos», la 07f.
import type { EntradaAgenda, MotivoPendiente, Tarea } from "./tipos";
import { urlImagenPictograma } from "../../arasaac/urls";

const arasaac = (id: number) => urlImagenPictograma(id, 500);

const T = (
  id: string,
  titulo: string,
  emoji: string,
  pictograma: number,
  extra: Partial<Tarea> = {},
): Tarea => ({
  id,
  titulo,
  emoji,
  pictograma_url: arasaac(pictograma),
  ...extra,
});

export const ESTUDIANTE_DEMO = "demo-alejandro";

export function agendaDemo(fecha: string): EntradaAgenda[] {
  const tareas: [string, number, Tarea, EntradaAgenda["estado"]][] = [
    [
      "09:00",
      30,
      T("t1", "Asamblea", "🗣️", 27574, {
        descripcion: "Nos sentamos en círculo. Decimos qué día es hoy.",
      }),
      "hecha",
    ],
    [
      "09:30",
      45,
      T("t2", "Lavarse las manos", "🧼", 8975, {
        descripcion: "Antes del desayuno nos lavamos las manos.",
        // HU-10: cada paso con título corto y texto en Lectura Fácil (07 y 07b).
        pasos: [
          {
            orden: 1,
            titulo: "Abre el grifo",
            texto: "Gira el grifo despacio para que salga agua templada.",
            pictograma_url: arasaac(2414),
          },
          {
            orden: 2,
            titulo: "Echa jabón",
            texto: "Pon una gota de jabón en la palma de tu mano.",
            pictograma_url: arasaac(2964),
          },
          {
            orden: 3,
            titulo: "Frota las manos",
            texto: "Frota las palmas y entre los dedos durante 20 segundos.",
            pictograma_url: arasaac(8251),
          },
          {
            orden: 4,
            titulo: "Aclara y sécate",
            texto: "Quita la espuma con agua y sécate bien las dos manos con la toalla.",
            pictograma_url: arasaac(2566),
          },
        ],
      }),
      "pendiente",
    ],
    [
      "10:15",
      30,
      T("t3", "Desayuno", "🥪", 4625, { descripcion: "Tomamos el desayuno en clase." }),
      "pendiente",
    ],
    [
      "10:45",
      45,
      T("t4", "Reprografía", "🖨️", 9876, {
        descripcion: "Hacemos las fotocopias que nos pide la tutora.",
      }),
      "pendiente",
    ],
    ["11:30", 30, T("t5", "Recreo", "⚽", 7137, { descripcion: "Salimos al patio." }), "pendiente"],
    ["12:00", 60, T("t6", "Taller de cocina", "🍳", 2342), "pendiente"],
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
    requiere_inicio_fin: true,
  }));
}

/** T-08.6: la misma agenda con «Lavarse las manos» a medias, para probar la pantalla 10b. */
export function agendaDemoPendiente(
  fecha: string,
  motivo: MotivoPendiente = "tiempo_agotado",
): EntradaAgenda[] {
  return agendaDemo(fecha).map((e) => (e.id === "e2" ? { ...e, pendiente_motivo: motivo } : e));
}

/**
 * HU-16: la misma agenda con las horas movidas para que «Reprografía» empiece en el primer minuto
 * en punto que esté a más de 5 min y 10 s. Así el aviso sale en menos de un minuto. Las tareas de
 * antes ya han empezado, así que «Reprografía» es la siguiente.
 */
export function agendaDemoAviso(fecha: string, ahora: Date = new Date()): EntradaAgenda[] {
  const inicio = new Date(Math.ceil((ahora.getTime() + 310_000) / 60_000) * 60_000);
  const base = inicio.getHours() * 60 + inicio.getMinutes();
  // Minutos respecto a «Reprografía» (cuarta tarea), respetando la duración de cada una.
  const desfase = [-105, -75, -30, 0, 45, 75];
  return agendaDemo(fecha).map((e, i) => {
    const t = Math.max(0, base + desfase[i]);
    const hora = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    return { ...e, hora_inicio: hora };
  });
}
