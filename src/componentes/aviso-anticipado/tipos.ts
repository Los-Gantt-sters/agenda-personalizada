// Tipos del aviso anticipatorio (HU-16).
// RF4.6: cinco minutos antes de la siguiente tarea se avisa con su pictograma.
// RNF4.3: el aviso se puede dejar en solo visual y nunca usa sonidos estridentes.
// RI4.2: datos del aviso (estudiante, tarea, antelación, tipo visual/sonoro y hora de emisión).
import type { EntradaAgenda } from "../agenda/tipos";

/** «visual»: solo la tarjeta (RNF4.3); «sonoro»: además un sonido suave. */
export type TipoAviso = "visual" | "sonoro";

/**
 * Preferencias del aviso del perfil del estudiante.
 * TODO(SCRUM-66): leerlas del panel de preferencias cuando esa rama llegue a main.
 */
export interface PreferenciasAviso {
  /** Si es false, no se avisa. */
  activado: boolean;
  /** Minutos de antelación (5 por defecto, RF4.6). */
  antelacionMin: number;
  tipo: TipoAviso;
  /** Vibración leve al aparecer (si el dispositivo la tiene). */
  vibracion: boolean;
  /** Tiempo que se enseña la tarjeta si no se toca (15 s). */
  duracionMs: number;
}

export const AVISO_POR_DEFECTO: PreferenciasAviso = {
  activado: true,
  antelacionMin: 5,
  tipo: "sonoro",
  vibracion: true,
  duracionMs: 15_000,
};

/** RI4.2: aviso anticipatorio emitido. */
export interface EventoAviso {
  estudiante_id: string;
  tarea_id: string;
  entrada_id: string;
  antelacion_min: number;
  tipo: TipoAviso;
  /** Hora de emisión (ISO 8601). */
  emitido_en: string;
  /** Entrada de la tarea que viene, para enseñar su pictograma y su título. */
  entrada: EntradaAgenda;
}
