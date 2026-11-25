// Tipos de la agenda del día (HU-06).
// RI4.1: entrada de agenda (estudiante, tarea, fecha, hora de inicio, duración prevista, orden y estado).
// HU-08 (T-08.1) añade el registro de ejecución de RI6.1 (hora real de inicio y de fin) y RF6.8.

export type EstadoEntrada = "pendiente" | "en_curso" | "hecha" | "cancelada" | "bloqueada";

/** T-08.6: por qué una tarea se quedó a medias y se puede retomar (pantalla 10b). */
export type MotivoPendiente = "tiempo_agotado" | "profesor";

/**
 * HU-10: foto, vídeo o audio de un paso. Los archivos subidos se guardan por `ruta` en el bucket
 * privado multimedia-pasos y la app los ve con una URL firmada que caduca (`url`).
 */
export interface RecursoPaso {
  /** Ruta en el bucket multimedia-pasos (<tarea>/<foto|video|audio>/<archivo>). */
  ruta?: string | null;
  /** URL para verlo: la firmada de Storage o una externa. */
  url?: string | null;
  tipo_mime?: string | null;
  tamano_bytes?: number | null;
  duracion_segundos?: number | null;
  /** Texto alternativo (lectores de pantalla). */
  descripcion?: string | null;
}

/** HU-10 (07): los 5 botones de debajo del paso. */
export type FormatoPaso = "pictograma" | "texto" | "foto" | "video" | "audio";

export interface PasoTarea {
  /** Id en pasos_tarea (no lo tienen los pasos nuevos del editor 28s hasta que se guardan). */
  id?: string | null;
  orden: number;
  /** HU-10: título corto del paso («Abre el grifo»). Si falta, se usa el texto. */
  titulo?: string | null;
  /** Texto en Lectura Fácil (07b). */
  texto: string;
  pictograma_url?: string | null;
  pictograma_id?: number | null;
  pictograma_origen?: "arasaac" | "propio" | null;
  /** HU-10: foto real (07c), vídeo (07d) y audio grabado del paso. */
  foto?: RecursoPaso | null;
  video?: RecursoPaso | null;
  audio?: RecursoPaso | null;
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
  /** HU-10: formatos que el profesor deja elegir al alumno en 07. Si falta, los 5. */
  formatos_permitidos?: FormatoPaso[] | null;
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
   * RF6.8: si el estudiante tiene que pulsar «Empezar» antes de «Terminar». Si no viene, sí (es
   * lo normal); solo con false se enseña directamente «Terminar», como en HU-06.
   */
  requiere_inicio_fin?: boolean | null;
  /** RI6.1: momento en que el estudiante pulsó «Empezar» (ISO 8601). */
  inicio_real?: string | null;
  /** RI6.1: momento en que el estudiante pulsó «Terminar» (ISO 8601). */
  fin_real?: string | null;
  /**
   * T-08.6: si está pendiente con motivo, se quedó a medias: sale en «Hecho» en ámbar y se retoma
   * desde la pantalla 10b. Solo existe en el frontend hasta que lo guarde SCRUM-237.
   */
  pendiente_motivo?: MotivoPendiente | null;
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
  /** «Atrás» tras «Empezar»: la entrada en curso vuelve a pendiente y se borra la hora de inicio. */
  desmarcarEnCurso(idEntrada: string): Promise<void>;
  /** «Atrás» tras «Terminar»: la entrada hecha vuelve a `volverA` y se borra la hora de fin. */
  desmarcarHecha(idEntrada: string, volverA: "pendiente" | "en_curso"): Promise<void>;
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
