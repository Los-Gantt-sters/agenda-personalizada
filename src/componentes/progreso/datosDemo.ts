// Datos de ejemplo de la pantalla 43 (HU-25): se usan con /progreso sin ?estudiante= y en las
// pruebas. Siempre salen los mismos para el mismo día, para que la demo no cambie al recargar.
import { aISO, deISO } from "./periodos";
import type {
  AmbitoTarea,
  AvisoProgreso,
  ProgresoAlumno,
  RepositorioProgreso,
  TareaProgreso,
} from "./tipos";

export const ESTUDIANTE_DEMO_PROGRESO = "demo";

interface Plantilla {
  hora: string;
  titulo: string;
  ambito: AmbitoTarea;
}

const DIA_DE_CLASE: Plantilla[] = [
  { hora: "09:00", titulo: "Asamblea", ambito: "centro" },
  { hora: "09:30", titulo: "Lavarse las manos", ambito: "centro" },
  { hora: "10:15", titulo: "Lectura fácil", ambito: "centro" },
  { hora: "11:30", titulo: "Huerto", ambito: "centro" },
  { hora: "13:30", titulo: "Comer en el comedor", ambito: "centro" },
  { hora: "19:00", titulo: "Preparar la mochila", ambito: "hogar" },
];

const FIN_DE_SEMANA: Plantilla[] = [
  { hora: "10:00", titulo: "Hacer la cama", ambito: "hogar" },
  { hora: "18:00", titulo: "Pasear al perro", ambito: "hogar" },
];

/** Reparto de emociones de la demo: sobre todo contento. */
const EMOCIONES_DEMO = [
  "contento",
  "contento",
  "contento",
  "contento",
  "tranquilo",
  "tranquilo",
  "cansado",
  "contento",
  "triste",
  "enfadado",
];

/** Número fijo a partir de un texto (el mismo texto da siempre el mismo número). */
function semilla(texto: string): number {
  let h = 7;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 100_003;
  return h;
}

function tareasDelDia(fecha: string, ahora: Date): TareaProgreso[] {
  const d = deISO(fecha);
  const plantilla = d.getDay() === 0 || d.getDay() === 6 ? FIN_DE_SEMANA : DIA_DE_CLASE;
  const hoy = aISO(ahora);
  const horaAhora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  let enCursoPuesta = false;
  return plantilla.map((p, i) => {
    const n = semilla(`${fecha}-${i}`);
    let estado: TareaProgreso["estado"] = "hecha";
    let motivo: string | null = null;
    if (fecha === hoy && p.hora > horaAhora) {
      estado = enCursoPuesta ? "pendiente" : "en_curso";
      enCursoPuesta = true;
    } else if (n % 11 === 0) {
      estado = "pendiente";
      motivo = "tiempo_agotado";
    }
    const hecha = estado === "hecha";
    return {
      id: `${fecha}-${i}`,
      fecha,
      hora: p.hora,
      titulo: p.titulo,
      pictograma_url: null,
      ambito: p.ambito,
      estado,
      pendiente_motivo: motivo,
      plan_b: hecha && n % 13 === 0,
      emocion: hecha ? EMOCIONES_DEMO[n % EMOCIONES_DEMO.length] : null,
      inicio_real: estado === "pendiente" ? null : `${fecha}T${p.hora}:00`,
      fin_real: hecha ? `${fecha}T${p.hora}:00` : null,
    };
  });
}

function avisosDelDia(fecha: string): AvisoProgreso[] {
  const n = semilla(`aviso-${fecha}`);
  const avisos: AvisoProgreso[] = [];
  if (n % 4 === 0)
    avisos.push({
      id: `aviso-${fecha}-bano`,
      necesidad: "bano",
      urgencia: false,
      atendido: true,
      creado_en: deISO(fecha).toISOString(),
    });
  if (n % 9 === 0)
    avisos.push({
      id: `aviso-${fecha}-agua`,
      necesidad: "agua",
      urgencia: false,
      atendido: true,
      creado_en: deISO(fecha).toISOString(),
    });
  return avisos;
}

/** Resumen, emociones y días a partir de las tareas: lo mismo que calcula progreso_alumno en SQL. */
export function consolidarProgreso(
  tareas: TareaProgreso[],
  avisos: AvisoProgreso[],
  desde: string,
  hasta: string,
  alumno: ProgresoAlumno["alumno"] = null,
): ProgresoAlumno {
  const cuenta = (f: (t: TareaProgreso) => boolean) => tareas.filter(f).length;
  const emociones = new Map<string, number>();
  const dias = new Map<string, { total: number; hechas: number }>();
  for (const t of tareas) {
    if (t.emocion) emociones.set(t.emocion, (emociones.get(t.emocion) ?? 0) + 1);
    const dia = dias.get(t.fecha) ?? { total: 0, hechas: 0 };
    dia.total += 1;
    if (t.estado === "hecha") dia.hechas += 1;
    dias.set(t.fecha, dia);
  }
  return {
    alumno,
    desde,
    hasta,
    resumen: {
      total: tareas.length,
      hechas: cuenta((t) => t.estado === "hecha"),
      pendientes: cuenta((t) => t.estado === "pendiente"),
      en_curso: cuenta((t) => t.estado === "en_curso"),
      sin_terminar: cuenta(
        (t) => t.estado === "pendiente" && t.pendiente_motivo === "tiempo_agotado",
      ),
      planes_b: cuenta((t) => t.plan_b),
    },
    emociones: [...emociones.entries()]
      .map(([emocion, total]) => ({ emocion, total }))
      .sort((a, b) => b.total - a.total || a.emocion.localeCompare(b.emocion)),
    dias: [...dias.entries()]
      .map(([fecha, d]) => ({ fecha, ...d }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    tareas,
    avisos: [...avisos].sort((a, b) => b.creado_en.localeCompare(a.creado_en)),
  };
}

/** Progreso de ejemplo de Alejandro entre dos fechas (sin días futuros: aún no hay historial). */
export function progresoDemo(
  desde: string,
  hasta: string,
  ahora: Date = new Date(),
): ProgresoAlumno {
  const tareas: TareaProgreso[] = [];
  const avisos: AvisoProgreso[] = [];
  const ultimo = hasta < aISO(ahora) ? hasta : aISO(ahora);
  for (let d = deISO(desde); aISO(d) <= ultimo; d.setDate(d.getDate() + 1)) {
    tareas.push(...tareasDelDia(aISO(d), ahora));
    avisos.push(...avisosDelDia(aISO(d)));
  }
  return {
    ...consolidarProgreso(tareas, avisos, desde, hasta, {
      id: ESTUDIANTE_DEMO_PROGRESO,
      nombre: "Alejandro",
    }),
    // Lo mismo que el boceto 43.
    dieta_comedor: "normal",
    valoracion: tareas.length ? { texto: "Trabaja con mucha autonomía", fecha: ultimo } : null,
  };
}

/** Repositorio de la demo: responde al momento con los datos de ejemplo. */
export const repositorioProgresoDemo: RepositorioProgreso = {
  obtener: async (_estudianteId, desde, hasta) => progresoDemo(desde, hasta),
};
