/**
 * Tipos para el módulo de Alertas Fisiológicas y Urgencias (HU-18 / SCRUM-88)
 * Alineado con RF11.1, RF11.2, RF11.3, RF11.6, RNF11.1 y RI11.1.
 */

export type TipoNecesidadFisiologica = "bano" | "agua" | "descanso";

export type EstadoAlerta = "pendiente" | "atendida" | "cancelada";

export interface AlertaNecesidad {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  tutorId: string;
  tipo: TipoNecesidadFisiologica;
  estado: EstadoAlerta;
  aula?: string;
  mensaje?: string;
  creadoEn: string;
  atendidoEn?: string;
}

export interface EmitirAlertaPayload {
  estudianteId: string;
  estudianteNombre: string;
  tutorId: string;
  tipo: TipoNecesidadFisiologica;
  aula?: string;
}
