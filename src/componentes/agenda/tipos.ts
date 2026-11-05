// Tipos de la agenda del día (HU-06).
// RI4.1: entrada de agenda (estudiante, tarea, fecha, hora de inicio, duración prevista, orden y estado).

export type EstadoEntrada = "pendiente" | "en_curso" | "hecha" | "cancelada" | "bloqueada";

export interface PasoTarea {
  orden: number;
  /** Texto en Lectura Fácil. */
  texto: string;
  pictograma_url?: string | null;
}

export interface Tarea {
  id: string;
  /** Título en Lectura Fácil (RNF4.4). */
  titulo: string;
  /** Pictograma ARASAAC o fotografía. Siempre acompaña al texto (RNF4.4). */
  pictograma_url?: string | null;
  /** Respaldo visual si la imagen no carga (sin red, URL rota...). */
  emoji?: string | null;
  descripcion?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  pasos?: PasoTarea[] | null;
}

export interface EntradaAgenda {
  id: string;
  estudiante_id: string;
  tarea_id: string;
  /** Fecha local en formato AAAA-MM-DD. */
  fecha: string;
  /** Hora de inicio en formato HH:MM (también se acepta HH:MM:SS). */
  hora_inicio: string;
  duracion_prevista_min: number;
  orden: number;
  estado: EstadoEntrada;
  tarea: Tarea;
}

/** Resultado de repartir la secuencia del día en los tres bloques (RF4.2). */
export interface BloquesAgenda {
  hecho: EntradaAgenda[];
  ahora: EntradaAgenda | null;
  despues: EntradaAgenda[];
  /** true si no queda ninguna tarea por hacer hoy. */
  diaTerminado: boolean;
}
