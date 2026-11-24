/**
 * Tipos de dominio para el Taller de Reprografía de alumnos PTVAL (HU-14 / SCRUM-108 / SCRUM-109).
 * Define la máquina de estados del encargo (Recogida -> Taller -> Reparto -> Completado),
 * los parámetros desglosados de solicitud docente y los 5 pasos adaptados a la estructura de Pantalla 12 (y 07).
 */

export type EstadoEncargoReprografia =
  "pendiente" | "recogida" | "taller" | "reparto" | "completado" | "cancelado";

export type ModoColorReprografia = "blanco_y_negro" | "color";
export type ModoCarasReprografia = "una_cara" | "dos_caras";
export type TipoEncuadernacionReprografia = "ninguno" | "grapado" | "plastificado" | "espiral";

export interface PasoReprografia {
  orden: 1 | 2 | 3 | 4 | 5;
  fase: "recogida" | "taller" | "reparto";
  titulo: string;
  texto: string;
  pictogramaId: number;
  pictogramaUrl: string;
  descripcionFoto: string;
  descripcionVideo: string;
  completado: boolean;
}

export interface CrearEncargoReprografiaInput {
  tituloDocumento: string;
  copias: number;
  modoColor: ModoColorReprografia;
  modoCaras: ModoCarasReprografia;
  acabado?: TipoEncuadernacionReprografia;
  aulaDestino: string;
  profesorSolicitante: string;
  estudianteId: string;
  duracionEstimadaMinutos?: number;
  observaciones?: string;
}

export interface EncargoReprografia {
  id: string;
  tituloDocumento: string;
  copias: number;
  modoColor: ModoColorReprografia;
  modoCaras: ModoCarasReprografia;
  acabado: TipoEncuadernacionReprografia;
  aulaDestino: string;
  profesorSolicitante: string;
  estudianteId: string;
  estado: EstadoEncargoReprografia;
  pasoActual: 1 | 2 | 3 | 4 | 5;
  duracionEstimadaMinutos: number;
  pasos: PasoReprografia[];
  observaciones?: string;
  creadoEn: string;
  actualizadoEn: string;
  completadoEn?: string;
}

export interface ReprografiaResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
