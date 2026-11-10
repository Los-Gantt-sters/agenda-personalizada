// Medidas derivadas de las preferencias, con las mismas fórmulas que el CSS del prototipo
// (tuagendita-prototipos.html): texto base = 16 px × escala de letra, y botones .sbtn con
// min-height/min-width = 64 px × escala, padding 24 px × escala y texto 1,2 em × escala.
import {
  FORMAS_BOTON,
  FUENTES,
  PreferenciasApariencia,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
} from "./opciones";

/** Área táctil mínima en cualquier caso (RNF14.3). */
export const AREA_TACTIL_MINIMA = 48;

export interface EstilosBoton {
  altoMinimo: number;
  anchoMinimo: number;
  paddingHorizontal: number;
  tamanoTexto: number;
  radio: number;
  borde: number;
}

export interface EstilosApariencia {
  fuenteNormal: string;
  fuenteNegrita: string;
  /** Tamaño de texto base (16 px × escala de letra). */
  tamanoTexto: number;
  /** Escala un tamaño de texto según la preferencia de tamaño de letra. */
  texto: (base: number) => number;
  radioTarjeta: number;
  boton: EstilosBoton;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function estilosApariencia(p: PreferenciasApariencia): EstilosApariencia {
  const letra = TAMANOS_LETRA[p.tamanoLetra].escala;
  const boton = TAMANOS_BOTON[p.tamanoBoton].escala;
  const forma = FORMAS_BOTON[p.forma];
  const fuente = FUENTES[p.fuente];
  const tamanoTexto = 16 * letra;

  return {
    fuenteNormal: fuente.familiaNormal,
    fuenteNegrita: fuente.familiaNegrita,
    tamanoTexto: redondear(tamanoTexto),
    texto: (base) => redondear(base * letra),
    radioTarjeta: forma.radioTarjeta,
    boton: {
      altoMinimo: Math.max(AREA_TACTIL_MINIMA, redondear(64 * boton)),
      anchoMinimo: Math.max(AREA_TACTIL_MINIMA, redondear(64 * boton)),
      paddingHorizontal: redondear(24 * boton),
      tamanoTexto: redondear(tamanoTexto * 1.2 * boton),
      radio: forma.radioBoton,
      borde: 3,
    },
  };
}
