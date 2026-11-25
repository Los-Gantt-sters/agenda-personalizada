// Tipos y constantes del motor de barrido por pulsadores (HU-05 / SCRUM-119 · T-05.1 / SCRUM-120).
// Estética alineada con BOCETOS_NUEVOS/definitiva_v2 (16.html, 22.html, 24.html, 06.html, 07.html, 11.html).

export type ModoBarridoPulsador = "desactivado" | "automatico" | "manual";

export type IntervaloBarridoMs = 1200 | 1600 | 2400 | 3200;

export const VELOCIDADES_BARRIDO_MS: IntervaloBarridoMs[] = [1200, 1600, 2400, 3200];

export const ETIQUETAS_VELOCIDAD_BARRIDO: Record<IntervaloBarridoMs, string> = {
  1200: "1,2 segundos (Rápido)",
  1600: "1,6 segundos (Normal)",
  2400: "2,4 segundos (Pausado)",
  3200: "3,2 segundos (Muy pausado)",
};

export const ETIQUETAS_MODO_BARRIDO: Record<
  ModoBarridoPulsador,
  { titulo: string; resumen: string }
> = {
  desactivado: {
    titulo: "Táctil directo",
    resumen: "Toque directo en pantalla sin barrido por pulsador",
  },
  automatico: {
    titulo: "Automático (1 pulsador)",
    resumen: "El marco de foco grueso avanza solo; 1 pulsador elige",
  },
  manual: {
    titulo: "Manual (2 pulsadores)",
    resumen: "Pulsador 1 avanza el foco grueso; Pulsador 2 elige",
  },
};

/** Grosor del borde de foco grueso para barrido por pulsador (>= 6 px, RF14.2 / RNF3.4). */
export const GROSOR_FOCO_BARRIDO_PX = 6;

export interface ConfiguracionBarrido {
  modo: ModoBarridoPulsador;
  intervaloMs: IntervaloBarridoMs;
  ciclico: boolean;
  mostrarBarraEstado: boolean;
}

export const CONFIGURACION_BARRIDO_POR_DEFECTO: ConfiguracionBarrido = {
  modo: "automatico",
  intervaloMs: 1600,
  ciclico: true,
  mostrarBarraEstado: true,
};

export interface ObjetivoBarrido {
  id: string;
  etiqueta: string;
  orden?: number;
  deshabilitado?: boolean;
  alActivar: () => void;
}

export interface RegistroActivacionBarrido {
  id: string;
  etiqueta: string;
  modo: ModoBarridoPulsador;
  origen: "pulsador_unico" | "pulsador_seleccion" | "teclado" | "tactil";
  timestamp: number;
}
