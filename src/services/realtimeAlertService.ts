import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  AlertaNecesidad,
  EmitirAlertaPayload,
  TipoNecesidadFisiologica,
} from "../types/necesidades";
import { reproducirSonido } from "../servicios/sonidos";

const CANAL_ALERTAS = "necesidades_fisiologicas_channel";
const EVENTO_NUEVA_ALERTA = "nueva_alerta_necesidad";
const EVENTO_ALERTA_ATENDIDA = "alerta_necesidad_atendida";

export interface SuscripcionTutorOptions {
  tutorId: string;
  onNuevaAlerta: (alerta: AlertaNecesidad) => void;
  onAlertaAtendida?: (alertaId: string) => void;
  reproducirAudio?: boolean;
}

/**
 * Emite una alerta de necesidad básica del estudiante en tiempo real (RF11.3, RNF11.1).
 */
export async function emitirAlertaNecesidad(
  payload: EmitirAlertaPayload,
): Promise<{ success: boolean; alerta?: AlertaNecesidad; error?: string }> {
  try {
    const nuevaAlerta: AlertaNecesidad = {
      id: `alerta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      estudianteId: payload.estudianteId,
      estudianteNombre: payload.estudianteNombre,
      tutorId: payload.tutorId,
      tipo: payload.tipo,
      estado: "pendiente",
      aula: payload.aula || "Aula Principal",
      creadoEn: new Date().toISOString(),
    };

    const channel = supabase.channel(CANAL_ALERTAS);
    await channel.send({
      type: "broadcast",
      event: EVENTO_NUEVA_ALERTA,
      payload: nuevaAlerta,
    });

    return {
      success: true,
      alerta: nuevaAlerta,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al emitir alerta en tiempo real";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Suscribe el terminal del tutor a las alertas en tiempo real de sus alumnos asignados (RNF11.1).
 * Al recibir una alerta inminente, reproduce el aviso sonoro no estridente (expo-audio).
 */
export function suscribirAlertasTutor(options: SuscripcionTutorOptions): RealtimeChannel {
  const channel = supabase.channel(CANAL_ALERTAS);

  channel
    .on("broadcast", { event: EVENTO_NUEVA_ALERTA }, (data) => {
      const alerta = data.payload as AlertaNecesidad;
      // Filtrar si el evento es para el tutor especificado
      if (alerta && (!alerta.tutorId || alerta.tutorId === options.tutorId)) {
        if (options.reproducirAudio !== false) {
          try {
            reproducirSonido("finTiempo", 0.8);
          } catch {
            // Manejo silencioso en caso de no interacción previa del usuario
          }
        }
        options.onNuevaAlerta(alerta);
      }
    })
    .on("broadcast", { event: EVENTO_ALERTA_ATENDIDA }, (data) => {
      const { alertaId } = data.payload as { alertaId: string };
      if (alertaId && options.onAlertaAtendida) {
        options.onAlertaAtendida(alertaId);
      }
    })
    .subscribe();

  return channel;
}

/**
 * Marca una solicitud de necesidad fisiológica como atendida en tiempo real (RF11.6).
 */
export async function marcarAlertaAtendida(
  alertaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const channel = supabase.channel(CANAL_ALERTAS);
    await channel.send({
      type: "broadcast",
      event: EVENTO_ALERTA_ATENDIDA,
      payload: { alertaId, atendidoEn: new Date().toISOString() },
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al marcar alerta como atendida";
    return { success: false, error: message };
  }
}

/**
 * Devuelve el texto amigable y accesible según el tipo de necesidad.
 */
export function getTextoNecesidad(tipo: TipoNecesidadFisiologica): string {
  switch (tipo) {
    case "bano":
      return "Quiero ir al baño";
    case "agua":
      return "Quiero agua";
    case "descanso":
      return "Necesito descanso";
    default:
      return "Necesito ayuda";
  }
}
