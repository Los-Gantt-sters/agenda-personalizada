// Tipos de la agenda del día (HU-06).
// RI4.1: entrada de agenda (estudiante, tarea, fecha, hora de inicio, duración prevista, orden y estado).
// HU-08 (T-08.1) añade el registro de ejecución de RI6.1 (hora real de inicio y de fin) y RF6.8.

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
  /** Hora de inicio en formato HH:MM (también se acepta HH:MM:SS); "" si la tarea no tiene hora fija. */
  hora_inicio: string;
  duracion_prevista_min: number;
  orden: number;
  estado: EstadoEntrada;
  tarea: Tarea;
  /**
   * RF6.8: el tutor marca que en esta tarea el estudiante tiene que pulsar «Empezar» antes de
   * «Terminar». Si es false o no viene, se enseña directamente «Terminar», como en HU-06.
   */
  requiere_inicio_fin?: boolean | null;
  /** RI6.1: momento en que el estudiante pulsó «Empezar» (ISO 8601). */
  inicio_real?: string | null;
  /** RI6.1: momento en que el estudiante pulsó «Terminar» (ISO 8601). */
  fin_real?: string | null;
}

/** Resultado de repartir la secuencia del día en los tres bloques (RF4.2). */
export interface BloquesAgenda {
  hecho: EntradaAgenda[];
  ahora: EntradaAgenda | null;
  despues: EntradaAgenda[];
  /** true si no queda ninguna tarea por hacer hoy. */
  diaTerminado: boolean;
}

/**
 * Acceso a los datos de la agenda (T-06.2). La pantalla solo conoce esta interfaz: en la app la
 * cumple src/servicios/agendaService.ts (Supabase) y en la demo y las pruebas, repositorioMemoria.
 */
export interface RepositorioAgenda {
  /** RF4.1: tareas del día del estudiante (sin ordenar; ordena logica.ts). */
  obtenerSecuenciaDia(estudianteId: string, fecha: string): Promise<EntradaAgenda[]>;
  /** RF6.1: pone la entrada en curso y guarda la hora de inicio (RI6.1). */
  marcarEnCurso(idEntrada: string, inicio: string): Promise<void>;
  /** RF4.3 y RF6.4: marca la entrada como hecha y guarda la hora de fin (RI6.1). */
  marcarHecha(idEntrada: string, fin?: string): Promise<void>;
  /**
   * RF4.7: avisa cada vez que cambia algo de la agenda del estudiante (el tutor crea, modifica,
   * bloquea o borra una tarea). Devuelve la función para darse de baja.
   */
  suscribir(
    estudianteId: string,
    fecha: string,
    alCambiar: () => void,
    idsVisibles: () => ReadonlySet<string>,
  ): () => void;
}
