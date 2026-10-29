// Cálculos del reloj visual (Time Timer). Sin React, para poder probarlos de forma aislada.

/** Tamaño del lienzo SVG del reloj (viewBox de 0 a 200), igual que en el prototipo. */
export const LADO_RELOJ = 200;
export const CENTRO_RELOJ = LADO_RELOJ / 2;

/**
 * Fracción del tiempo que queda, entre 0 (se ha acabado) y 1 (no ha empezado).
 * Se limita a ese rango para que el disco nunca se dibuje "de más" ni en negativo.
 */
export function fraccionRestante(duracionMs: number, transcurridoMs: number): number {
  if (duracionMs <= 0) return 0;
  const fraccion = 1 - transcurridoMs / duracionMs;
  return Math.min(1, Math.max(0, fraccion));
}

/**
 * Indica si el tiempo se acaba de agotar en este momento (pasa de quedar algo a no quedar nada).
 * Sirve para avisar una sola vez y no al abrir una tarea que ya estaba terminada.
 */
export function seAcabaDeAgotar(fraccionAnterior: number, fraccionActual: number): boolean {
  return fraccionAnterior > 0 && fraccionActual <= 0;
}

/** Punto de la circunferencia a `fraccion` de vuelta desde las 12, en sentido antihorario. */
function puntoAntihorario(fraccion: number, radio: number): { x: number; y: number } {
  const angulo = fraccion * 2 * Math.PI;
  return {
    x: redondear(CENTRO_RELOJ - radio * Math.sin(angulo)),
    y: redondear(CENTRO_RELOJ - radio * Math.cos(angulo)),
  };
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Atributo `d` del <path> SVG con el sector del tiempo restante.
 * Empieza en las 12 y se abre en sentido antihorario, de modo que al pasar el tiempo
 * el disco se va recortando hacia las 12, como un Time Timer real.
 * Devuelve `null` si no queda tiempo (no hay nada que dibujar).
 */
export function trazadoSector(fraccion: number, radio: number): string | null {
  const c = CENTRO_RELOJ;
  if (fraccion <= 0) return null;

  // Un arco SVG no puede empezar y acabar en el mismo punto: el círculo completo se
  // dibuja como dos medios arcos.
  if (fraccion >= 1) {
    return `M ${c} ${c - radio} A ${radio} ${radio} 0 1 0 ${c} ${c + radio} A ${radio} ${radio} 0 1 0 ${c} ${c - radio} Z`;
  }

  const fin = puntoAntihorario(fraccion, radio);
  // large-arc = 1 cuando el sector ocupa más de media vuelta; sweep = 0 es antihorario
  const arcoGrande = fraccion > 0.5 ? 1 : 0;
  return `M ${c} ${c} L ${c} ${c - radio} A ${radio} ${radio} 0 ${arcoGrande} 0 ${fin.x} ${fin.y} Z`;
}

/** Las 12 marcas horarias como segmentos entre `radioInterior` y `radioExterior`. */
export function marcasReloj(
  radioExterior: number,
  radioInterior: number,
): { x1: number; y1: number; x2: number; y2: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const exterior = puntoAntihorario(i / 12, radioExterior);
    const interior = puntoAntihorario(i / 12, radioInterior);
    return { x1: exterior.x, y1: exterior.y, x2: interior.x, y2: interior.y };
  });
}
