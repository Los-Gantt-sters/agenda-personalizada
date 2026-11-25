/**
 * Servicio de notificaciones Push SOS en tiempo real (canal pub-sub / WebSockets)
 * con alarma acústica persistente para el Tutor (Pantallas 33 y 47)
 * (SCRUM-126 / SCRUM-128 · T-19.2).
 */

import {
  ALERTAS_SOS_INICIALES_47,
  crearAlertaSosDesdeNecesidad,
  type AlertaSosTutor,
} from "../componentes/alertas-sos/datosAlertasSos";
import type { ClaveNecesidad } from "../necesidades/tipos";
import { reproducirSonido } from "./sonidos";

export type ListenerAlertasSos = (alertas: AlertaSosTutor[]) => void;

export interface ContextoActivoAlumnoSos {
  alumnoId: string;
  nombreAlumno: string;
  salaActual: string;
  tareaActiva: string;
  actualizadoEnIso?: string;
}

const CONTEXTOS_POR_DEFECTO: Record<string, ContextoActivoAlumnoSos> = {
  ale: {
    alumnoId: "ale",
    nombreAlumno: "Alejandro",
    salaActual: "Clase Triángulo",
    tareaActiva: "Lavarse las manos",
  },
  mar: {
    alumnoId: "mar",
    nombreAlumno: "Marcos",
    salaActual: "Clase Triángulo",
    tareaActiva: "Asamblea",
  },
  luc: {
    alumnoId: "luc",
    nombreAlumno: "Lucas",
    salaActual: "Clase Cuadrado",
    tareaActiva: "Lavarse las manos",
  },
};

let contextosAlumnos = new Map<string, ContextoActivoAlumnoSos>(
  Object.entries(CONTEXTOS_POR_DEFECTO),
);
let alertasEnMemoria: AlertaSosTutor[] = [...ALERTAS_SOS_INICIALES_47];
const suscriptores = new Set<ListenerAlertasSos>();
let temporizadorAlarma: ReturnType<typeof setInterval> | null = null;

/**
 * Registra la última sala/aula y la tarea activa que está realizando un alumno,
 * para adjuntarlas automáticamente si pulsa el botón de Ayuda o Urgencia (SCRUM-129 · T-19.3).
 * @param contexto Datos de sala actual y tarea activa del alumno
 */
export function registrarContextoActivoAlumno(contexto: ContextoActivoAlumnoSos): void {
  contextosAlumnos.set(contexto.alumnoId, {
    ...contexto,
    actualizadoEnIso: contexto.actualizadoEnIso ?? new Date().toISOString(),
  });
}

/**
 * Obtiene el último contexto registrado (sala actual y tarea activa) de un alumno.
 * @param alumnoId Identificador del alumno
 * @returns Contexto activo del alumno con sala y tarea en curso
 */
export function obtenerContextoActivoAlumno(alumnoId: string): ContextoActivoAlumnoSos {
  return (
    contextosAlumnos.get(alumnoId) ?? {
      alumnoId,
      nombreAlumno: "Alejandro",
      salaActual: "Clase Triángulo",
      tareaActiva: "Lavarse las manos",
    }
  );
}

/**
 * Emite una alerta SOS push adjuntando automáticamente la última sala registrada
 * y la tarea activa del alumno en ese instante (SCRUM-129 · T-19.3).
 * @param alumnoId Identificador del alumno que solicita auxilio
 * @param claveNecesidad Necesidad o urgencia pulsada
 * @param opciones Opciones adicionales (`id`, `tiempoTexto`, `intervaloAlarmaMs`)
 * @returns La alerta SOS generada con la sala y tarea activa del alumno
 */
export function emitirAlertaSosConContextoActivo(
  alumnoId: string,
  claveNecesidad: ClaveNecesidad,
  opciones?: {
    id?: string;
    tiempoTexto?: string;
    intervaloAlarmaMs?: number;
  },
): AlertaSosTutor {
  const ctx = obtenerContextoActivoAlumno(alumnoId);
  return emitirAlertaSosPush(
    {
      id: opciones?.id,
      alumnoId: ctx.alumnoId,
      nombreAlumno: ctx.nombreAlumno,
      claveNecesidad,
      tareaActiva: ctx.tareaActiva,
      salaActual: ctx.salaActual,
      tiempoTexto: opciones?.tiempoTexto,
    },
    opciones?.intervaloAlarmaMs,
  );
}

function notificarSuscriptores(): void {
  const copia = [...alertasEnMemoria];
  suscriptores.forEach((fn) => fn(copia));
}

/**
 * Devuelve la lista actual de alertas SOS del tutor.
 * @returns Copia de las alertas SOS ordenadas de más reciente a más antigua
 */
export function obtenerAlertasSosActivas(): AlertaSosTutor[] {
  return [...alertasEnMemoria];
}

/**
 * Cuenta cuántas alertas SOS push siguen sin leer (`atendida === false`).
 * Este contador alimenta tanto el borde rojo e insignia «Push · N sin leer»
 * de la tarjeta en el Panel del Tutor (33) como el contador de la Pantalla 47.
 * @param lista Lista opcional de alertas (por defecto usa las activas en memoria)
 * @returns Número de alertas sin leer
 */
export function contarAlertasSosSinLeer(lista: AlertaSosTutor[] = alertasEnMemoria): number {
  return lista.filter((a) => !a.atendida).length;
}

/**
 * Indica si la alarma acústica persistente de SOS está sonando actualmente.
 * @returns `true` si el intervalo de alarma está activo
 */
export function estaAlarmaAcusticaSosActiva(): boolean {
  return temporizadorAlarma !== null;
}

/**
 * Detiene inmediatamente la alarma acústica persistente de SOS.
 */
export function detenerAlarmaAcusticaSos(): void {
  if (temporizadorAlarma !== null) {
    clearInterval(temporizadorAlarma);
    temporizadorAlarma = null;
  }
}

/**
 * Inicia la alarma acústica persistente cuando llega una notificación push SOS prioritaria,
 * reproduciendo el tono de aviso de inmediato y repitiéndolo periódicamente mientras
 * existan alertas sin atender.
 * @param esUrgencia Si es `true`, reproduce con volumen máximo (`1.0`)
 * @param intervaloMs Intervalo de repetición en milisegundos (`4000` por defecto)
 */
export function iniciarAlarmaAcusticaSos(
  esUrgencia: boolean = true,
  intervaloMs: number = 4000,
): void {
  const volumen = esUrgencia ? 1.0 : 0.8;
  reproducirSonido("aviso", volumen);

  detenerAlarmaAcusticaSos();
  temporizadorAlarma = setInterval(() => {
    if (contarAlertasSosSinLeer() <= 0) {
      detenerAlarmaAcusticaSos();
      return;
    }
    reproducirSonido("aviso", volumen);
  }, intervaloMs);
}

/**
 * Suscribe al panel del Tutor (33 / 47) a los eventos push en tiempo real de alertas SOS.
 * @param listener Función que recibe la lista actualizada de alertas
 * @returns Función para cancelar la suscripción
 */
export function suscribirAlertasSosPush(listener: ListenerAlertasSos): () => void {
  suscriptores.add(listener);
  listener([...alertasEnMemoria]);
  return () => {
    suscriptores.delete(listener);
  };
}

/**
 * Emite una notificación push SOS prioritaria hacia el Tutor, activa la alarma
 * acústica persistente y notifica en tiempo real a todos los clientes suscritos.
 * @param params Datos del alumno, necesidad/urgencia y contexto activo
 * @param intervaloAlarmaMs Intervalo de repetición de la alarma acústica
 * @returns La nueva alerta SOS creada
 */
export function emitirAlertaSosPush(
  params: {
    id?: string;
    alumnoId: string;
    nombreAlumno: string;
    claveNecesidad: ClaveNecesidad;
    tareaActiva?: string;
    salaActual?: string;
    tiempoTexto?: string;
  },
  intervaloAlarmaMs: number = 4000,
): AlertaSosTutor {
  const nueva = crearAlertaSosDesdeNecesidad(params);
  alertasEnMemoria = [nueva, ...alertasEnMemoria];
  iniciarAlarmaAcusticaSos(nueva.esUrgencia, intervaloAlarmaMs);
  notificarSuscriptores();
  return nueva;
}

/**
 * Marca una alerta SOS como atendida (`atendida: true`), notifica a los suscriptores
 * en tiempo real y silencia automáticamente la alarma acústica persistente si ya no
 * quedan alertas sin leer.
 * @param alertaId Identificador de la alerta atendida
 * @returns Lista actualizada de alertas SOS
 */
export function marcarAlertaSosAtendida(alertaId: string): AlertaSosTutor[] {
  alertasEnMemoria = alertasEnMemoria.map((a) =>
    a.id === alertaId ? { ...a, atendida: true } : a,
  );
  if (contarAlertasSosSinLeer() === 0) {
    detenerAlarmaAcusticaSos();
  }
  notificarSuscriptores();
  return [...alertasEnMemoria];
}

/**
 * Restaura las alertas iniciales de demostración (`47.html`) y detiene cualquier alarma activa.
 * @param iniciales Lista inicial opcional
 */
export function reiniciarAlertasSosDemo(
  iniciales: AlertaSosTutor[] = ALERTAS_SOS_INICIALES_47,
): void {
  detenerAlarmaAcusticaSos();
  contextosAlumnos = new Map<string, ContextoActivoAlumnoSos>(
    Object.entries(CONTEXTOS_POR_DEFECTO),
  );
  alertasEnMemoria = [...iniciales];
  notificarSuscriptores();
}
