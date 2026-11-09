/**
 * Tipos y contratos para el Registro de Marcas de Tiempo Reales (SCRUM-76 / T-08.3)
 * Alineado al 100% con:
 *   - profeV2-1.pdf (Sección 5.2.1: Entidad Ejecución)
 *   - Figura 3: Modelo conceptual (inicio, fin, estado final, pasos confirmados, 3 caritas)
 *   - Requisitos: OE13 (telemetría y trazabilidad pedagógica), RI6.1 (inicio_real y fin_real)
 */

export type ValoracionEmocional = "contento" | "neutral" | "triste" | "bien" | "regular" | "mal";

export type EstadoFinalEjecucion = "completada" | "bloqueada" | "cancelada" | "incompleta";

export interface PasoConfirmado {
  paso: number;
  texto?: string;
  confirmadoEn: string; // ISO 8601 timestamp
}

/**
 * Registro de telemetría y ejecución en tiempo real de una tarea (Ejecución en Fig. 3)
 */
export interface EjecucionTarea {
  id: string;
  asignacionId: string;
  estudianteId: string;
  inicio: string; // ISO 8601 marca de inicio real («Empezar»)
  fin?: string; // ISO 8601 marca de fin real («Terminar»)
  duracionRealSegundos?: number; // Calculado al finalizar
  desviacionSegundos?: number; // Diferencia respecto a la estimación programada
  duracionEstimadaMinutos?: number;
  estadoFinal?: EstadoFinalEjecucion;
  pasosConfirmados: PasoConfirmado[];
  valoracionEmocional?: ValoracionEmocional; // 3 caritas de feedback
  observaciones?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

/**
 * Datos requeridos para registrar el inicio de una tarea al pulsar «Empezar» (RF6.1, RI6.1)
 */
export interface RegistrarInicioInput {
  asignacionId: string;
  estudianteId: string;
  inicio?: string; // Opcional, si no se indica se genera Date.now() en servidor/cliente
  duracionEstimadaMinutos?: number;
  origenDisparo?: "tactil" | "pulsador" | "remoto";
}

/**
 * Datos requeridos para registrar el fin de una tarea al pulsar «Terminar» (RF6.4, RI6.1)
 */
export interface RegistrarFinInput {
  asignacionId: string;
  fin?: string; // Opcional, por defecto timestamp actual
  estadoFinal?: EstadoFinalEjecucion; // Por defecto 'completada'
  valoracionEmocional?: ValoracionEmocional;
  observaciones?: string;
}

/**
 * Datos para registrar la confirmación de un paso intermedio
 */
export interface RegistrarPasoInput {
  asignacionId: string;
  paso: number;
  texto?: string;
  confirmadoEn?: string;
}

/**
 * Métricas consolidadas de autonomía y rendimiento del estudiante (OE13)
 */
export interface MetricasRendimiento {
  estudianteId: string;
  totalEjecuciones: number;
  completadas: number;
  bloqueadas: number;
  canceladas: number;
  tasaExitoPorcentaje: number;
  duracionMediaSegundos: number;
  desviacionMediaSegundos: number;
  desgloseEmocional: {
    positivo: number; // contento / bien
    neutro: number; // neutral / regular
    negativo: number; // triste / mal
  };
}

export interface MarcasTiempoResult<T = EjecucionTarea> {
  success: boolean;
  data?: T;
  error?: string;
}
