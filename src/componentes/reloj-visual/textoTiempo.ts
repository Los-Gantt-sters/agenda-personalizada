// Texto en Lectura Fácil con el tiempo que queda (HU-09, T-09.2).

const MS_POR_MINUTO = 60 * 1000;

/**
 * Devuelve el rótulo del reloj visual, por ejemplo "Quedan 3 minutos".
 * Redondea hacia arriba para no anunciar menos tiempo del que hay de verdad.
 * @param restanteMs tiempo que queda, en milisegundos
 */
export function textoTiempoRestante(restanteMs: number): string {
  if (restanteMs <= 0) {
    return "Se ha acabado el tiempo";
  }

  const minutos = Math.ceil(restanteMs / MS_POR_MINUTO);
  if (minutos === 1) {
    return "Queda 1 minuto";
  }
  return `Quedan ${minutos} minutos`;
}
