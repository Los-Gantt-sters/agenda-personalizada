/**
 * T-T03.2 [Accesibilidad/UI] Design System accesible con tokens de color, contrastes y tipografías (SCRUM-164).
 * Archivo centralizado de temas, paletas y constantes de contraste WCAG 2.1 AA / AAA y EN 301 549.
 * Cumple con RNF3.2, RNF14.1, RNF14.2, RNF14.3 y RNF14.4.
 */

/** Umbral mínimo WCAG 2.1 AA para texto normal (>= 4,5:1). */
export const WCAG_AA_TEXTO = 4.5;
export const WCAG_AA_TEXT = WCAG_AA_TEXTO;

/** Umbral mínimo WCAG 2.1 AAA para texto en modos de alto contraste (>= 7,0:1). */
export const WCAG_AAA_TEXTO = 7.0;
export const WCAG_AAA_TEXT = WCAG_AAA_TEXTO;

/** Umbral mínimo WCAG 2.1 AA (1.4.11) para elementos táctiles, bordes y componentes UI (>= 3,0:1). */
export const WCAG_AA_ELEMENTO_TACTIL = 3.0;
export const WCAG_AA_UI = WCAG_AA_ELEMENTO_TACTIL;

/** Dimensiones táctiles y constantes de interacción motora (RNF1.1, RNF6.1, RNF14.3, RF14.2). */
export const AREA_TACTIL_MINIMA_PX = 48;
export const MIN_TOUCH_TARGET_PX = AREA_TACTIL_MINIMA_PX;

export const ALTURA_BOTON_ESTANDAR_PX = 64;
export const AREA_LOGIN_VISUAL_MINIMA_PX = 120;
export const SEPARACION_MINIMA_TACTIL_PX = 8;
export const GROSOR_BORDE_FOCO_PX = 4;
export const DESPLAZAMIENTO_FOCO_PX = 3;
export const PULSACION_SOSTENIDA_MS = 1500;

/** Nombres de los 4 temas principales del informe de accesibilidad + variantes de alto contraste. */
export type NombreTemaAccesible =
  "claro" | "oscuro" | "pastel" | "altoContraste" | "altoContrasteClaro" | "altoContrasteOscuro";

export interface PaletaTemaAccesible {
  /** Fondo general de la pantalla (--d-bg). */
  fondo: string;
  /** Fondo de tarjetas, paneles y modales (--d-card). */
  superficie: string;
  /** Fondo destacado para el bloque «Ahora» o elemento activo (--d-now). */
  superficieDestacada: string;
  /** Fondo suave para tarjetas secundarias (--d-soft). */
  superficieSuave: string;
  /** Texto principal (--d-ink). */
  texto: string;
  /** Texto secundario o subtítulos (--d-sub). */
  textoSecundario: string;
  /** Color de acción principal para botones interactivos (--d-acc). */
  primario: string;
  /** Texto o icono sobre el color primario (--d-acc-ink). */
  textoSobrePrimario: string;
  /** Bordes y divisores con contraste >= 3:1 (--d-line). */
  borde: string;
  /** Anillo de foco visible para teclado y pulsador (RF14.2). */
  foco: string;
  /** Estado de tarea completada o confirmación (--d-ok). */
  exito: string;
  /** Texto o icono sobre fondo de éxito. */
  textoSobreExito: string;
  /** Botón de necesidades, urgencias o error crítico (--d-need). */
  peligro: string;
  /** Texto o icono sobre fondo de peligro. */
  textoSobrePeligro: string;
  /** Aviso preventivo (ej. 5 minutos antes de transición). */
  aviso: string;
  /** Texto o icono sobre fondo de aviso. */
  textoSobreAviso: string;
  /** Color del disco regresivo del reloj visual Time Timer (--d-clock). */
  reloj: string;
}

export interface DefinicionTemaAccesible {
  id: NombreTemaAccesible;
  etiqueta: string;
  esOscuro: boolean;
  esAltoContraste: boolean;
  colores: PaletaTemaAccesible;
}

const PALETA_CLARO: PaletaTemaAccesible = {
  fondo: "#F4F7FB",
  superficie: "#FFFFFF",
  superficieDestacada: "#E3EDFB",
  superficieSuave: "#EEF2F8",
  texto: "#14213D",
  textoSecundario: "#435068",
  primario: "#1F5FA8",
  textoSobrePrimario: "#FFFFFF",
  borde: "#64728A",
  foco: "#14213D",
  exito: "#1F6E3D",
  textoSobreExito: "#FFFFFF",
  peligro: "#B82820",
  textoSobrePeligro: "#FFFFFF",
  aviso: "#8A5300",
  textoSobreAviso: "#FFFFFF",
  reloj: "#C8374B",
};

const PALETA_OSCURO: PaletaTemaAccesible = {
  fondo: "#11161F",
  superficie: "#1B2230",
  superficieDestacada: "#23314B",
  superficieSuave: "#161C28",
  texto: "#EEF2F8",
  textoSecundario: "#B8C2D6",
  primario: "#86B7FF",
  textoSobrePrimario: "#0B1220",
  borde: "#8290AB",
  foco: "#FFFFFF",
  exito: "#74D69F",
  textoSobreExito: "#0B1220",
  peligro: "#FF8A7A",
  textoSobrePeligro: "#0B1220",
  aviso: "#F0C445",
  textoSobreAviso: "#0B1220",
  reloj: "#FF8F9C",
};

const PALETA_PASTEL: PaletaTemaAccesible = {
  fondo: "#EAF5F1",
  superficie: "#FBFFFD",
  superficieDestacada: "#D3ECE4",
  superficieSuave: "#E1F0EA",
  texto: "#1D3832",
  textoSecundario: "#3B564F",
  primario: "#246A5B",
  textoSobrePrimario: "#FFFFFF",
  borde: "#567E74",
  foco: "#143D35",
  exito: "#236939",
  textoSobreExito: "#FFFFFF",
  peligro: "#A8332B",
  textoSobrePeligro: "#FFFFFF",
  aviso: "#7A5400",
  textoSobreAviso: "#FFFFFF",
  reloj: "#B5443A",
};

const PALETA_ALTO_CONTRASTE_OSCURO: PaletaTemaAccesible = {
  fondo: "#000000",
  superficie: "#0B0B0B",
  superficieDestacada: "#1B1900",
  superficieSuave: "#111111",
  texto: "#FFFFFF",
  textoSecundario: "#FFE566",
  primario: "#FFD400",
  textoSobrePrimario: "#000000",
  borde: "#FFFFFF",
  foco: "#FFD400",
  exito: "#7CFF8A",
  textoSobreExito: "#000000",
  peligro: "#FF6B6B",
  textoSobrePeligro: "#000000",
  aviso: "#FFD400",
  textoSobreAviso: "#000000",
  reloj: "#FF6B6B",
};

const PALETA_ALTO_CONTRASTE_CLARO: PaletaTemaAccesible = {
  fondo: "#FFFFFF",
  superficie: "#FFFFFF",
  superficieDestacada: "#E6E6FF",
  superficieSuave: "#F2F2F2",
  texto: "#000000",
  textoSecundario: "#1A1A1A",
  primario: "#0000B8",
  textoSobrePrimario: "#FFFFFF",
  borde: "#000000",
  foco: "#000000",
  exito: "#005A1E",
  textoSobreExito: "#FFFFFF",
  peligro: "#A30000",
  textoSobrePeligro: "#FFFFFF",
  aviso: "#664400",
  textoSobreAviso: "#FFFFFF",
  reloj: "#A30000",
};

/** Mapa completo de temas accesibles validados según WCAG 2.1 AA / AAA. */
export const TEMAS_ACCESIBLES: Record<NombreTemaAccesible, DefinicionTemaAccesible> = {
  claro: {
    id: "claro",
    etiqueta: "Claro",
    esOscuro: false,
    esAltoContraste: false,
    colores: PALETA_CLARO,
  },
  oscuro: {
    id: "oscuro",
    etiqueta: "Oscuro",
    esOscuro: true,
    esAltoContraste: false,
    colores: PALETA_OSCURO,
  },
  pastel: {
    id: "pastel",
    etiqueta: "Pastel suave",
    esOscuro: false,
    esAltoContraste: false,
    colores: PALETA_PASTEL,
  },
  altoContraste: {
    id: "altoContraste",
    etiqueta: "Alto contraste",
    esOscuro: true,
    esAltoContraste: true,
    colores: PALETA_ALTO_CONTRASTE_OSCURO,
  },
  altoContrasteClaro: {
    id: "altoContrasteClaro",
    etiqueta: "Alto contraste claro",
    esOscuro: false,
    esAltoContraste: true,
    colores: PALETA_ALTO_CONTRASTE_CLARO,
  },
  altoContrasteOscuro: {
    id: "altoContrasteOscuro",
    etiqueta: "Alto contraste oscuro",
    esOscuro: true,
    esAltoContraste: true,
    colores: PALETA_ALTO_CONTRASTE_OSCURO,
  },
};

/** Colección directa de paletas por nombre de tema (exportada también como COLORS / THEME_COLORS). */
export const PALETAS_COLOR: Record<NombreTemaAccesible, PaletaTemaAccesible> = {
  claro: PALETA_CLARO,
  oscuro: PALETA_OSCURO,
  pastel: PALETA_PASTEL,
  altoContraste: PALETA_ALTO_CONTRASTE_OSCURO,
  altoContrasteClaro: PALETA_ALTO_CONTRASTE_CLARO,
  altoContrasteOscuro: PALETA_ALTO_CONTRASTE_OSCURO,
};

export const COLORS = PALETAS_COLOR;
export const THEME_COLORS = PALETAS_COLOR;

/** Los 4 temas troncales definidos en el Informe de Accesibilidad (claro, oscuro, pastel, altoContraste). */
export const NOMBRES_CUATRO_TEMAS: NombreTemaAccesible[] = [
  "claro",
  "oscuro",
  "pastel",
  "altoContraste",
];

/**
 * Indicadores semánticos multimodales (RNF14.4: Independencia del color).
 * Garantiza que en modo acromatopsia (escala de grises) cada estado se distinga por símbolo + texto.
 */
export interface IndicadorEstadoAccesible {
  clave: "hecho" | "ahora" | "despues" | "bloqueado" | "urgencia" | "planB";
  icono: string;
  etiquetaLecturaFacil: string;
  tokenColor: keyof Pick<
    PaletaTemaAccesible,
    "exito" | "primario" | "textoSecundario" | "peligro" | "aviso"
  >;
}

export const INDICADORES_ESTADO: Record<
  IndicadorEstadoAccesible["clave"],
  IndicadorEstadoAccesible
> = {
  hecho: {
    clave: "hecho",
    icono: "✓",
    etiquetaLecturaFacil: "Hecho",
    tokenColor: "exito",
  },
  ahora: {
    clave: "ahora",
    icono: "▶",
    etiquetaLecturaFacil: "Ahora",
    tokenColor: "primario",
  },
  despues: {
    clave: "despues",
    icono: "⏳",
    etiquetaLecturaFacil: "Después",
    tokenColor: "textoSecundario",
  },
  bloqueado: {
    clave: "bloqueado",
    icono: "🔒",
    etiquetaLecturaFacil: "Tarea bloqueada",
    tokenColor: "textoSecundario",
  },
  urgencia: {
    clave: "urgencia",
    icono: "🆘",
    etiquetaLecturaFacil: "Pedir ayuda urgente",
    tokenColor: "peligro",
  },
  planB: {
    clave: "planB",
    icono: "🔄",
    etiquetaLecturaFacil: "Cambio tranquilo de actividad",
    tokenColor: "aviso",
  },
};

/** Convierte un color hexadecimal (#RRGGBB) en una tupla [R, G, B] (0-255). */
export function hexARgb(hex: string): [number, number, number] {
  const limpio = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!limpio) {
    throw new Error(`Formato hexadecimal no válido: ${hex}`);
  }
  const valor = parseInt(limpio[1], 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

/** Calcula la luminancia relativa según la fórmula oficial de WCAG 2.1 (0 = negro, 1 = blanco). */
export function calcularLuminanciaRelativa(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((canal) => {
    const sRGB = canal / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Calcula el ratio de contraste WCAG 2.1 entre dos colores hexadecimales (rango 1 a 21). */
export function calcularRatioContraste(colorA: string, colorB: string): number {
  const lumA = calcularLuminanciaRelativa(colorA);
  const lumB = calcularLuminanciaRelativa(colorB);
  const mayor = Math.max(lumA, lumB);
  const menor = Math.min(lumA, lumB);
  return Math.round(((mayor + 0.05) / (menor + 0.05)) * 100) / 100;
}

export const getContrastRatio = calcularRatioContraste;

/** Comprueba si dos colores cumplen el contraste mínimo WCAG 2.1 AA para texto (>= 4,5:1). */
export function cumpleContrasteTextoAA(primerPlano: string, fondo: string): boolean {
  return calcularRatioContraste(primerPlano, fondo) >= WCAG_AA_TEXTO;
}

/** Comprueba si dos colores cumplen el contraste mínimo WCAG 2.1 AAA para texto (>= 7,0:1). */
export function cumpleContrasteTextoAAA(primerPlano: string, fondo: string): boolean {
  return calcularRatioContraste(primerPlano, fondo) >= WCAG_AAA_TEXTO;
}

/** Comprueba si dos colores cumplen el contraste mínimo WCAG 2.1 AA para elementos táctiles/UI (>= 3,0:1). */
export function cumpleContrasteElementoTactilAA(elemento: string, fondo: string): boolean {
  return calcularRatioContraste(elemento, fondo) >= WCAG_AA_ELEMENTO_TACTIL;
}

export interface ResultadoValidacionContraste {
  tema: NombreTemaAccesible;
  cumpleTextoAA: boolean;
  cumpleTextoAAA: boolean;
  cumpleElementosTactilesAA: boolean;
  ratioMinimoTexto: number;
  ratioMinimoElementoTactil: number;
  paresEvaluados: Record<string, number>;
}

/**
 * Valida todos los pares de texto y de elementos táctiles de una paleta según WCAG 2.1 AA y AAA.
 */
export function validarContrasteTema(
  nombreTema: NombreTemaAccesible,
): ResultadoValidacionContraste {
  const p = PALETAS_COLOR[nombreTema];

  const paresTexto: Record<string, number> = {
    "texto/fondo": calcularRatioContraste(p.texto, p.fondo),
    "texto/superficie": calcularRatioContraste(p.texto, p.superficie),
    "texto/superficieDestacada": calcularRatioContraste(p.texto, p.superficieDestacada),
    "textoSecundario/fondo": calcularRatioContraste(p.textoSecundario, p.fondo),
    "textoSecundario/superficie": calcularRatioContraste(p.textoSecundario, p.superficie),
    "textoSobrePrimario/primario": calcularRatioContraste(p.textoSobrePrimario, p.primario),
    "textoSobreExito/exito": calcularRatioContraste(p.textoSobreExito, p.exito),
    "textoSobrePeligro/peligro": calcularRatioContraste(p.textoSobrePeligro, p.peligro),
    "textoSobreAviso/aviso": calcularRatioContraste(p.textoSobreAviso, p.aviso),
  };

  const paresElementosTactiles: Record<string, number> = {
    "primario/fondo": calcularRatioContraste(p.primario, p.fondo),
    "primario/superficie": calcularRatioContraste(p.primario, p.superficie),
    "borde/fondo": calcularRatioContraste(p.borde, p.fondo),
    "borde/superficie": calcularRatioContraste(p.borde, p.superficie),
    "foco/fondo": calcularRatioContraste(p.foco, p.fondo),
    "foco/superficie": calcularRatioContraste(p.foco, p.superficie),
    "reloj/superficie": calcularRatioContraste(p.reloj, p.superficie),
  };

  const valoresTexto = Object.values(paresTexto);
  const valoresTactiles = Object.values(paresElementosTactiles);
  const ratioMinimoTexto = Math.min(...valoresTexto);
  const ratioMinimoElementoTactil = Math.min(...valoresTactiles);

  return {
    tema: nombreTema,
    cumpleTextoAA: ratioMinimoTexto >= WCAG_AA_TEXTO,
    cumpleTextoAAA: ratioMinimoTexto >= WCAG_AAA_TEXTO,
    cumpleElementosTactilesAA: ratioMinimoElementoTactil >= WCAG_AA_ELEMENTO_TACTIL,
    ratioMinimoTexto,
    ratioMinimoElementoTactil,
    paresEvaluados: { ...paresTexto, ...paresElementosTactiles },
  };
}
