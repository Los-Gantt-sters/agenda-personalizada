/**
 * Tipos y contratos para las Tareas y Actividades de la Agenda (HU-06, HU-08, SCRUM-62)
 * Alineado con el esquema de base de datos Supabase y requisitos OE5, RF10.1, RF11.1
 */

import { AmbitoActuacion } from "./alumnos";

export type EstadoTarea = "pendiente" | "en_curso" | "hecho" | "bloqueada";

export interface PasoTarea {
  orden: number;
  texto: string;
  pictograma?: string;
  completado?: boolean;
}

export interface PlanAlternativo {
  titulo: string;
  pictograma?: string;
  motivo?: string;
}

export interface Tarea {
  id: string;
  alumnoId: string;
  titulo: string;
  descripcion?: string;
  pictogramaId?: number; // Identificador oficial ARASAAC
  pictogramaUrl?: string;
  ambito: AmbitoActuacion; // "centro" (escolar) o "hogar" (doméstico)
  estado: EstadoTarea;
  motivoBloqueo?: string;
  horaInicio?: string;
  horaFin?: string;
  duracionMinutos?: number;
  orden: number;
  pasos?: PasoTarea[];
  planesB?: PlanAlternativo[];
  requierePresenciaTutor: boolean;
  creadoPor?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}
