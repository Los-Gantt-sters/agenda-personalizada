// Tipos de la pantalla 43 «Progreso e historial» (HU-25, SCRUM-146). Son los del JSON que devuelve
// la función progreso_alumno de Supabase (SCRUM-145, supabase/migrations/20261128000000_progreso_alumno.sql).

/**
 * Los estados de una tarea en la base: hecha, en curso o pendiente. En la 43 una pendiente se ve
 * como «Pendiente» si se le pasó la hora (tiene pendiente_motivo o es de un día pasado) y como «Por
 * hacer» si aún no ha llegado su hora (resumen.ts, esPendiente). La base aún admite «bloqueada»
 * (esquema inicial), pero ninguna pantalla la pone: el servicio la cuenta como pendiente.
 */
export type EstadoProgreso = "hecha" | "pendiente" | "en_curso";

/** Dónde se hace la tarea: en clase («centro») o en casa («hogar»). */
export type AmbitoTarea = "centro" | "hogar";

export interface TareaProgreso {
  id: string;
  /** AAAA-MM-DD. */
  fecha: string;
  /** HH:MM, o null si la tarea no tiene hora fija. */
  hora: string | null;
  titulo: string;
  pictograma_url?: string | null;
  ambito: AmbitoTarea;
  estado: EstadoProgreso;
  /** «tiempo_agotado»: se acabó su franja sin terminarla (SCRUM-265). «profesor»: la dejó a medias el tutor. */
  pendiente_motivo: string | null;
  /** Se activó su Plan B. */
  plan_b: boolean;
  /** Cómo se sintió al terminar (ejecuciones.valoracion_emocional). */
  emocion: string | null;
  inicio_real: string | null;
  fin_real: string | null;
}

export interface ResumenProgreso {
  total: number;
  hechas: number;
  /** Pendientes: las sin empezar y las sin terminar. */
  pendientes: number;
  en_curso: number;
  /** Pendientes porque se acabó su tiempo sin terminarlas. */
  sin_terminar: number;
  /** Tareas con el Plan B activado. */
  planes_b: number;
}

export interface EmocionProgreso {
  emocion: string;
  total: number;
}

export interface DiaProgreso {
  /** AAAA-MM-DD. */
  fecha: string;
  total: number;
  hechas: number;
}

/** Lo que ha pedido el alumno con el botón «Ayuda» (tabla avisos_peticiones). */
export interface AvisoProgreso {
  id: string;
  necesidad: string;
  urgencia: boolean;
  atendido: boolean;
  /** Fecha y hora ISO 8601. */
  creado_en: string;
}

export interface ProgresoAlumno {
  alumno: { id: string; nombre: string } | null;
  desde: string;
  hasta: string;
  resumen: ResumenProgreso;
  /** De la más a la menos frecuente. */
  emociones: EmocionProgreso[];
  /** Solo los días que tienen tareas, en orden. */
  dias: DiaProgreso[];
  /** En orden de día y hora. */
  tareas: TareaProgreso[];
  /** Del más reciente al más antiguo. */
  avisos: AvisoProgreso[];
}

/**
 * Acceso a los datos del progreso. La pantalla solo conoce esta interfaz: en la app la cumple
 * src/servicios/progresoService.ts (Supabase) y en la demo y las pruebas, datosDemo.ts.
 */
export interface RepositorioProgreso {
  obtener(estudianteId: string, desde: string, hasta: string): Promise<ProgresoAlumno>;
}
