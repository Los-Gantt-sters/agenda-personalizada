// Opciones de apariencia que el tutor puede elegir para cada estudiante (T-04.3, HU-04).
// Los valores salen de tuagendita-prototipos.html: FONTS, FS, BS, SHAPES y canales (canal / chan),
// con la variante A como valores por defecto.
import { NombreTema, TEMA_POR_DEFECTO, esNombreTema } from "../temas";

// ---- Tipo de letra (RF3.2): las tres fuentes pensadas para Lectura Fácil del prototipo ----
export type FuenteLetra = "atkinson" | "lexend" | "andika";

export interface InfoFuente {
  etiqueta: string;
  /** Nombre con el que se registra la fuente normal al cargarla (ver fuentes.ts). */
  familiaNormal: string;
  /** Nombre con el que se registra la fuente en negrita. */
  familiaNegrita: string;
}

export const FUENTES: Record<FuenteLetra, InfoFuente> = {
  atkinson: {
    etiqueta: "Atkinson Hyperlegible",
    familiaNormal: "AtkinsonHyperlegible_400Regular",
    familiaNegrita: "AtkinsonHyperlegible_700Bold",
  },
  lexend: {
    etiqueta: "Lexend",
    familiaNormal: "Lexend_400Regular",
    familiaNegrita: "Lexend_700Bold",
  },
  andika: {
    etiqueta: "Andika",
    familiaNormal: "Andika_400Regular",
    familiaNegrita: "Andika_700Bold",
  },
};

// ---- Tamaño de letra (RF3.3) ----
export type TamanoLetra = "normal" | "grande" | "extra";

export const TAMANOS_LETRA: Record<TamanoLetra, { etiqueta: string; escala: number }> = {
  normal: { etiqueta: "Normal", escala: 1 },
  grande: { etiqueta: "Grande", escala: 1.15 },
  extra: { etiqueta: "Extra grande", escala: 1.3 },
};

// ---- Tamaño de los botones (RF3.4: al menos tres opciones) ----
export type TamanoBoton = "M" | "L" | "XL";

export const TAMANOS_BOTON: Record<TamanoBoton, { etiqueta: string; escala: number }> = {
  M: { etiqueta: "Mediano", escala: 1 },
  L: { etiqueta: "Grande", escala: 1.15 },
  XL: { etiqueta: "Extra grande", escala: 1.32 },
};

// ---- Forma de los botones (RF3.5) ----
export type FormaBoton = "round" | "square" | "pill";

export const FORMAS_BOTON: Record<
  FormaBoton,
  { etiqueta: string; radioTarjeta: number; radioBoton: number }
> = {
  round: { etiqueta: "Redondeados", radioTarjeta: 20, radioBoton: 16 },
  square: { etiqueta: "Cuadrados", radioTarjeta: 4, radioBoton: 4 },
  pill: { etiqueta: "Circulares", radioTarjeta: 32, radioBoton: 999 },
};

// ---- Canal cognitivo de presentación (RF3.1, RI3.1, RNF4.4) ----
// Permite elegir si en cada pantalla se ven solo dibujos/pictogramas, solo texto o ambos.
export type ModoCanal = "ambos" | "soloPictograma" | "soloTexto";

export interface InfoModoCanal {
  clave: ModoCanal;
  etiqueta: string;
  descripcion: string;
  icono: string;
}

export const MODOS_CANAL: Record<ModoCanal, InfoModoCanal> = {
  ambos: {
    clave: "ambos",
    etiqueta: "Dibujo y texto",
    descripcion: "Muestra el pictograma junto al texto en Lectura Fácil",
    icono: "🖼️🔤",
  },
  soloPictograma: {
    clave: "soloPictograma",
    etiqueta: "Solo pictograma",
    descripcion: "Solo muestra dibujos gigantes (sin texto para no lectores)",
    icono: "🖼️",
  },
  soloTexto: {
    clave: "soloTexto",
    etiqueta: "Solo texto",
    descripcion: "Solo muestra texto en letra grande (evita sobreestimulación)",
    icono: "🔤",
  },
};

/** Orden en que se muestran las opciones en el panel. */
export const ORDEN_FUENTES: FuenteLetra[] = ["atkinson", "lexend", "andika"];
export const ORDEN_TAMANOS_LETRA: TamanoLetra[] = ["normal", "grande", "extra"];
export const ORDEN_TAMANOS_BOTON: TamanoBoton[] = ["M", "L", "XL"];
export const ORDEN_FORMAS: FormaBoton[] = ["round", "square", "pill"];
export const ORDEN_MODOS_CANAL: ModoCanal[] = ["ambos", "soloPictograma", "soloTexto"];

/** RI3.1: preferencias de visualización del estudiante que cubre este panel. */
export interface PreferenciasApariencia {
  tema: NombreTema;
  fuente: FuenteLetra;
  tamanoLetra: TamanoLetra;
  tamanoBoton: TamanoBoton;
  forma: FormaBoton;
  canal: ModoCanal;
}

/** Valores de la variante A del prototipo: clara, Atkinson, redondeados, botones grandes, ambos. */
export const PREFERENCIAS_POR_DEFECTO: PreferenciasApariencia = {
  tema: TEMA_POR_DEFECTO,
  fuente: "atkinson",
  tamanoLetra: "normal",
  tamanoBoton: "L",
  forma: "round",
  canal: "ambos",
};

const tiene = (objeto: object, clave: unknown): boolean =>
  typeof clave === "string" && Object.prototype.hasOwnProperty.call(objeto, clave);

/**
 * Convierte datos de origen dudoso (p. ej. el perfil guardado en la base de datos) en preferencias
 * válidas: lo que falte o no exista se sustituye por el valor por defecto.
 */
export function normalizarPreferencias(crudo: unknown): PreferenciasApariencia {
  const d = PREFERENCIAS_POR_DEFECTO;
  if (typeof crudo !== "object" || crudo === null) return { ...d };
  const c = crudo as Record<string, unknown>;
  return {
    tema: esNombreTema(c.tema) ? c.tema : d.tema,
    fuente: tiene(FUENTES, c.fuente) ? (c.fuente as FuenteLetra) : d.fuente,
    tamanoLetra: tiene(TAMANOS_LETRA, c.tamanoLetra)
      ? (c.tamanoLetra as TamanoLetra)
      : d.tamanoLetra,
    tamanoBoton: tiene(TAMANOS_BOTON, c.tamanoBoton)
      ? (c.tamanoBoton as TamanoBoton)
      : d.tamanoBoton,
    forma: tiene(FORMAS_BOTON, c.forma) ? (c.forma as FormaBoton) : d.forma,
    canal: tiene(MODOS_CANAL, c.canal) ? (c.canal as ModoCanal) : d.canal,
  };
}
