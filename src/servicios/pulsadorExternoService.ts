// Servicio de captura de eventos de pulsador externo Bluetooth / USB / Teclado HID (SCRUM-121 · T-05.2, HU-05).
// Traduce las señales de pulsadores adaptados (1 o 2 pulsadores) en acciones del motor de barrido
// ("avanzar", "retroceder", "seleccionar"), con filtro anti-rebote (debounce) para evitar
// pulsaciones dobles involuntarias en alumnado con afectación motora (RNF3.4, RF14.2).

import type { ModoBarridoPulsador } from "../componentes/barrido-pulsadores/tiposBarrido";

export type AccionPulsadorExterno = "avanzar" | "retroceder" | "seleccionar" | "ignorar";

export interface EventoEntradaPulsador {
  key: string;
  code?: string;
  shiftKey?: boolean;
  repeat?: boolean;
  targetTagName?: string;
  timestamp?: number;
}

export interface ConfiguracionPulsadorExterno {
  /** Ventana anti-rebote en milisegundos para filtrar temblores o rebotes mecánicos del switch. */
  antiReboteMs: number;
  /** Ignorar eventos mantenidos (key repeat del sistema operativo). */
  ignorarRepeticionMantenida: boolean;
  /** Teclas o códigos HID que avanzan el foco en modo manual (Pulsador 1). */
  teclasAvanzarManual: string[];
  /** Teclas o códigos HID que retroceden el foco en modo manual. */
  teclasRetrocederManual: string[];
  /** Teclas o códigos HID que seleccionan/activan en modo manual (Pulsador 2). */
  teclasSeleccionarManual: string[];
  /** Teclas o códigos HID que seleccionan/activan en modo automático de 1 único pulsador. */
  teclasPulsadorUnico: string[];
}

export const CONFIGURACION_PULSADOR_EXTERNO_POR_DEFECTO: ConfiguracionPulsadorExterno = {
  antiReboteMs: 220,
  ignorarRepeticionMantenida: true,
  teclasAvanzarManual: [
    " ",
    "Space",
    "Spacebar",
    "Tab",
    "ArrowRight",
    "ArrowDown",
    "F7",
    "Switch1",
    "GamepadButton0",
  ],
  teclasRetrocederManual: ["ArrowLeft", "ArrowUp"],
  teclasSeleccionarManual: [
    "Enter",
    "NumpadEnter",
    "F8",
    "Switch2",
    "GamepadButton1",
  ],
  teclasPulsadorUnico: [
    " ",
    "Space",
    "Spacebar",
    "Enter",
    "NumpadEnter",
    "F7",
    "F8",
    "Switch1",
    "Switch2",
    "GamepadButton0",
  ],
};

export interface ResultadoCapturaPulsador {
  ejecutado: boolean;
  accion: AccionPulsadorExterno;
  motivoIgnorado?: "modo_desactivado" | "campo_texto" | "repeticion_mantenida" | "rebote" | "tecla_no_mapeada";
  tecla: string;
  timestamp: number;
}

const ETIQUETAS_CAMPO_TEXTO = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function coincideTecla(evento: EventoEntradaPulsador, lista: string[]): boolean {
  return (
    lista.includes(evento.key) ||
    (typeof evento.code === "string" && lista.includes(evento.code))
  );
}

/**
 * Determina qué acción de barrido corresponde a un evento de teclado/pulsador USB/Bluetooth
 * según el modo de barrido activo ("automatico" = 1 pulsador, "manual" = 2 pulsadores).
 */
export function resolverAccionPulsador(
  evento: EventoEntradaPulsador,
  modo: ModoBarridoPulsador,
  config: ConfiguracionPulsadorExterno = CONFIGURACION_PULSADOR_EXTERNO_POR_DEFECTO,
): { accion: AccionPulsadorExterno; motivoIgnorado?: ResultadoCapturaPulsador["motivoIgnorado"] } {
  if (modo === "desactivado") {
    return { accion: "ignorar", motivoIgnorado: "modo_desactivado" };
  }

  const tag = evento.targetTagName?.toUpperCase();
  if (tag && ETIQUETAS_CAMPO_TEXTO.has(tag)) {
    return { accion: "ignorar", motivoIgnorado: "campo_texto" };
  }

  if (config.ignorarRepeticionMantenida && evento.repeat) {
    return { accion: "ignorar", motivoIgnorado: "repeticion_mantenida" };
  }

  if (modo === "automatico") {
    if (coincideTecla(evento, config.teclasPulsadorUnico)) {
      return { accion: "seleccionar" };
    }
    return { accion: "ignorar", motivoIgnorado: "tecla_no_mapeada" };
  }

  // Modo manual (2 pulsadores o teclado adaptado)
  if (evento.key === "Tab" && evento.shiftKey) {
    return { accion: "retroceder" };
  }
  if (coincideTecla(evento, config.teclasRetrocederManual)) {
    return { accion: "retroceder" };
  }
  if (coincideTecla(evento, config.teclasSeleccionarManual)) {
    return { accion: "seleccionar" };
  }
  if (coincideTecla(evento, config.teclasAvanzarManual)) {
    return { accion: "avanzar" };
  }

  return { accion: "ignorar", motivoIgnorado: "tecla_no_mapeada" };
}

/**
 * Controlador con estado anti-rebote (debounce) para procesar eventos de pulsador externo.
 */
export class ControladorPulsadorExterno {
  private config: ConfiguracionPulsadorExterno;
  private ultimoDisparoMs: number = -Infinity;
  private rechazadosPorRebote: number = 0;
  private disparosEjecutados: number = 0;

  constructor(config?: Partial<ConfiguracionPulsadorExterno>) {
    this.config = {
      ...CONFIGURACION_PULSADOR_EXTERNO_POR_DEFECTO,
      ...config,
    };
  }

  public actualizarConfiguracion(cambios: Partial<ConfiguracionPulsadorExterno>): void {
    this.config = { ...this.config, ...cambios };
  }

  public obtenerEstadisticas(): { disparosEjecutados: number; rechazadosPorRebote: number } {
    return {
      disparosEjecutados: this.disparosEjecutados,
      rechazadosPorRebote: this.rechazadosPorRebote,
    };
  }

  public reiniciar(): void {
    this.ultimoDisparoMs = -Infinity;
    this.rechazadosPorRebote = 0;
    this.disparosEjecutados = 0;
  }

  public procesarEvento(
    evento: EventoEntradaPulsador,
    modo: ModoBarridoPulsador,
    callbacks: {
      alAvanzar?: () => void;
      alRetroceder?: () => void;
      alSeleccionar?: () => void;
    },
  ): ResultadoCapturaPulsador {
    const ahora = evento.timestamp ?? Date.now();
    const { accion, motivoIgnorado } = resolverAccionPulsador(evento, modo, this.config);

    if (accion === "ignorar") {
      return {
        ejecutado: false,
        accion: "ignorar",
        motivoIgnorado,
        tecla: evento.key,
        timestamp: ahora,
      };
    }

    if (ahora - this.ultimoDisparoMs < this.config.antiReboteMs) {
      this.rechazadosPorRebote += 1;
      return {
        ejecutado: false,
        accion,
        motivoIgnorado: "rebote",
        tecla: evento.key,
        timestamp: ahora,
      };
    }

    this.ultimoDisparoMs = ahora;
    this.disparosEjecutados += 1;

    if (accion === "avanzar") {
      callbacks.alAvanzar?.();
    } else if (accion === "retroceder") {
      callbacks.alRetroceder?.();
    } else if (accion === "seleccionar") {
      callbacks.alSeleccionar?.();
    }

    return {
      ejecutado: true,
      accion,
      tecla: evento.key,
      timestamp: ahora,
    };
  }
}
