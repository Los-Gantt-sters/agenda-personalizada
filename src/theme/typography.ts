/**
 * Tokens tipográficos y de escala para Lectura Fácil y accesibilidad cognitiva/visual (SCRUM-164 / T-T03.2).
 * Cumple con RNF3.1, RNF4.2 (Zoom 200%), RNF4.4 (Lectura Fácil) y RNF14.3 (áreas táctiles >= 48x48 px).
 */

import { ALTURA_BOTON_ESTANDAR_PX, AREA_TACTIL_MINIMA_PX } from "./colors";

export type ClaveFamiliaTipografica = "atkinson" | "lexend" | "andika" | "sistema";
export type EscalaTamanoTexto = "normal" | "grande" | "gigante";
export type EscalaTamanoBoton = "normal" | "grande" | "gigante";
export type FormaElementoUI = "redondeado" | "cuadrado" | "pastilla";

export interface DefinicionFamiliaTipografica {
  id: ClaveFamiliaTipografica;
  etiqueta: string;
  familiaRegular: string;
  familiaNegrita: string;
  descripcionLecturaFacil: string;
}

export const FAMILIAS_TIPOGRAFICAS: Record<ClaveFamiliaTipografica, DefinicionFamiliaTipografica> =
  {
    atkinson: {
      id: "atkinson",
      etiqueta: "Atkinson Hyperlegible",
      familiaRegular: "AtkinsonHyperlegible-Regular",
      familiaNegrita: "AtkinsonHyperlegible-Bold",
      descripcionLecturaFacil: "Letra muy clara pensada para baja visión",
    },
    lexend: {
      id: "lexend",
      etiqueta: "Lexend",
      familiaRegular: "Lexend-Regular",
      familiaNegrita: "Lexend-Bold",
      descripcionLecturaFacil: "Letra espaciada que facilita la lectura fluida",
    },
    andika: {
      id: "andika",
      etiqueta: "Andika",
      familiaRegular: "Andika-Regular",
      familiaNegrita: "Andika-Bold",
      descripcionLecturaFacil: "Letra escolar sencilla para lectores iniciales",
    },
    sistema: {
      id: "sistema",
      etiqueta: "Sistema sin serifa",
      familiaRegular: "System",
      familiaNegrita: "System",
      descripcionLecturaFacil: "Letra limpia por defecto del dispositivo",
    },
  };

/** Factores de escala de letra (normal = 1, grande = 1.18, gigante = 1.38) según el prototipo. */
export const ESCALAS_TEXTO: Record<EscalaTamanoTexto, number> = {
  normal: 1.0,
  grande: 1.18,
  gigante: 1.38,
};

/** Factores de escala de botones táctiles (normal = 1, grande = 1.2, gigante = 1.45). */
export const ESCALAS_BOTON: Record<EscalaTamanoBoton, number> = {
  normal: 1.0,
  grande: 1.2,
  gigante: 1.45,
};

/** Radios de borde según la preferencia de forma del alumno. */
export const RADIOS_FORMA: Record<FormaElementoUI, { tarjeta: number; boton: number }> = {
  redondeado: { tarjeta: 20, boton: 16 },
  cuadrado: { tarjeta: 4, boton: 4 },
  pastilla: { tarjeta: 32, boton: 999 },
};

/** Constantes de Lectura Fácil (UNE 153101 EX / RNF4.4). */
export const REGLAS_LECTURA_FACIL = {
  tamanoBasePx: 16,
  interlineadoMinimo: 1.4,
  interlineadoTitulos: 1.25,
  maxCaracteresPorLinea: 60,
  espaciadoParrafoPx: 12,
} as const;

export interface TokensTipografiaYEscala {
  familiaRegular: string;
  familiaNegrita: string;
  escalaTexto: number;
  escalaBoton: number;
  cuerpoPx: number;
  subtituloPx: number;
  tituloPx: number;
  tituloPrincipalPx: number;
  interlineadoCuerpoPx: number;
  interlineadoTituloPx: number;
  altoMinimoBotonPx: number;
  anchoMinimoBotonPx: number;
  paddingHorizontalBotonPx: number;
  tamanoTextoBotonPx: number;
  radioTarjetaPx: number;
  radioBotonPx: number;
}

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

/**
 * Calcula los tokens tipográficos y geométricos aplicando las escalas de accesibilidad del alumno.
 * Garantiza siempre que cualquier botón táctil mida al menos 48x48 px (RNF14.3).
 */
export function calcularTokensTipografia(opciones?: {
  familia?: ClaveFamiliaTipografica;
  tamanoTexto?: EscalaTamanoTexto;
  tamanoBoton?: EscalaTamanoBoton;
  forma?: FormaElementoUI;
}): TokensTipografiaYEscala {
  const claveFamilia = opciones?.familia ?? "atkinson";
  const claveTexto = opciones?.tamanoTexto ?? "normal";
  const claveBoton = opciones?.tamanoBoton ?? "normal";
  const claveForma = opciones?.forma ?? "redondeado";

  const infoFamilia = FAMILIAS_TIPOGRAFICAS[claveFamilia];
  const escalaTexto = ESCALAS_TEXTO[claveTexto];
  const escalaBoton = ESCALAS_BOTON[claveBoton];
  const radios = RADIOS_FORMA[claveForma];

  const cuerpoPx = redondear(REGLAS_LECTURA_FACIL.tamanoBasePx * escalaTexto);
  const subtituloPx = redondear(cuerpoPx * 1.15);
  const tituloPx = redondear(cuerpoPx * 1.35);
  const tituloPrincipalPx = redondear(cuerpoPx * 1.7);

  const dimensionBotonCalculada = redondear(ALTURA_BOTON_ESTANDAR_PX * escalaBoton);
  const dimensionBotonSegura = Math.max(AREA_TACTIL_MINIMA_PX, dimensionBotonCalculada);

  return {
    familiaRegular: infoFamilia.familiaRegular,
    familiaNegrita: infoFamilia.familiaNegrita,
    escalaTexto,
    escalaBoton,
    cuerpoPx,
    subtituloPx,
    tituloPx,
    tituloPrincipalPx,
    interlineadoCuerpoPx: redondear(cuerpoPx * REGLAS_LECTURA_FACIL.interlineadoMinimo),
    interlineadoTituloPx: redondear(tituloPx * REGLAS_LECTURA_FACIL.interlineadoTitulos),
    altoMinimoBotonPx: dimensionBotonSegura,
    anchoMinimoBotonPx: dimensionBotonSegura,
    paddingHorizontalBotonPx: redondear(24 * escalaBoton),
    tamanoTextoBotonPx: redondear(cuerpoPx * 1.2 * escalaBoton),
    radioTarjetaPx: radios.tarjeta,
    radioBotonPx: radios.boton,
  };
}
