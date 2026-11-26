/**
 * Modelo de datos y alertas iniciales para la Pantalla 47 (Alertas SOS · Push en tiempo real)
 * y el botón de auxilio/urgencia de un solo toque (14 -> 14b -> 33 -> 47)
 * siguiendo exactamente los bocetos `BOCETOS_NUEVOS/definitiva_v2/pantallas/47.html`,
 * `14.html` y `14b.html` (SCRUM-126 / SCRUM-127 · HU-19).
 */

import { urlImagenPictograma } from "../../arasaac/urls";
import type { ClaveNecesidad } from "../../necesidades/tipos";

export interface AlertaSosTutor {
  id: string;
  alumnoId: string;
  nombreAlumno: string;
  claveNecesidad: ClaveNecesidad;
  textoNecesidad: string;
  pictogramaId: number;
  pictogramaUrl: string;
  tareaActiva: string;
  salaActual: string;
  tiempoTexto: string;
  atendida: boolean;
  esUrgencia: boolean;
  creadaEnIso?: string;
}

export const PICTO_POR_NECESIDAD: Record<
  ClaveNecesidad,
  { etiqueta: string; pictogramaId: number }
> = {
  bano: { etiqueta: "Quiero ir al baño", pictogramaId: 6929 },
  agua: { etiqueta: "Quiero agua", pictogramaId: 2248 },
  descanso: { etiqueta: "Necesito descansar", pictogramaId: 3299 },
  urgencia: { etiqueta: "Urgencia", pictogramaId: 12252 },
};

/**
 * Alertas iniciales exactas del boceto `47.html`:
 * 1. Alejandro · Push hace 1 minuto (`Sin leer`): «Quiero agua» desde «Lavarse las manos».
 * 2. Marcos · hace 25 minutos (`Atendida`): «Necesito descansar» desde «Asamblea».
 */
export const ALERTAS_SOS_INICIALES_47: AlertaSosTutor[] = [
  {
    id: "sos-0",
    alumnoId: "ale",
    nombreAlumno: "Alejandro",
    claveNecesidad: "agua",
    textoNecesidad: "Quiero agua",
    pictogramaId: 2248,
    pictogramaUrl: urlImagenPictograma(2248),
    tareaActiva: "Lavarse las manos",
    salaActual: "Clase Triángulo",
    tiempoTexto: "Push hace 1 minuto",
    atendida: false,
    esUrgencia: false,
  },
  {
    id: "sos-1",
    alumnoId: "mar",
    nombreAlumno: "Marcos",
    claveNecesidad: "descanso",
    textoNecesidad: "Necesito descansar",
    pictogramaId: 3299,
    pictogramaUrl: urlImagenPictograma(3299),
    tareaActiva: "Asamblea",
    salaActual: "Clase Triángulo",
    tiempoTexto: "hace 25 minutos",
    atendida: true,
    esUrgencia: false,
  },
];

/**
 * Construye una nueva alerta SOS push a partir de la necesidad o urgencia pulsada por el alumno.
 * @param params Datos del alumno, necesidad pulsada y contexto activo (tarea y sala)
 * @returns Nueva instancia `AlertaSosTutor` marcada como no atendida (`atendida: false`)
 */
export function crearAlertaSosDesdeNecesidad(params: {
  id?: string;
  alumnoId: string;
  nombreAlumno: string;
  claveNecesidad: ClaveNecesidad;
  tareaActiva?: string;
  salaActual?: string;
  tiempoTexto?: string;
}): AlertaSosTutor {
  const meta = PICTO_POR_NECESIDAD[params.claveNecesidad] ?? PICTO_POR_NECESIDAD.urgencia;
  const esUrgencia = params.claveNecesidad === "urgencia";
  return {
    id: params.id ?? `sos-${Date.now()}`,
    alumnoId: params.alumnoId,
    nombreAlumno: params.nombreAlumno,
    claveNecesidad: params.claveNecesidad,
    textoNecesidad: meta.etiqueta,
    pictogramaId: meta.pictogramaId,
    pictogramaUrl: urlImagenPictograma(meta.pictogramaId),
    tareaActiva: params.tareaActiva ?? "Lavarse las manos",
    salaActual: params.salaActual ?? "Clase Triángulo",
    tiempoTexto: params.tiempoTexto ?? "Push ahora mismo",
    atendida: false,
    esUrgencia,
    creadaEnIso: new Date().toISOString(),
  };
}
