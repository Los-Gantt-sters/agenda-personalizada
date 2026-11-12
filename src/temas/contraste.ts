// Cálculo de contraste de color según WCAG 2.1 (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).

/** Convierte "#RRGGBB" en sus tres canales 0-255. Lanza error si el formato no es válido. */
export function hexARgb(hex: string): [number, number, number] {
  const limpio = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!limpio) {
    throw new Error(`Color no válido: ${hex}`);
  }
  const n = parseInt(limpio[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminancia relativa de un color (0 negro, 1 blanco). */
export function luminanciaRelativa(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste entre dos colores, de 1 (iguales) a 21 (blanco sobre negro). */
export function ratioContraste(colorA: string, colorB: string): number {
  const la = luminanciaRelativa(colorA);
  const lb = luminanciaRelativa(colorB);
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Mínimos de WCAG 2.1: texto normal AA 4,5 · AAA 7 · componentes de interfaz y texto grande 3. */
export const CONTRASTE_AA_TEXTO = 4.5;
export const CONTRASTE_AAA_TEXTO = 7;
export const CONTRASTE_AA_COMPONENTES = 3;
