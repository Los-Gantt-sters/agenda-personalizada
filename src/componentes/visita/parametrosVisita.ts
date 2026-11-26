// Parámetros de la ruta /visita (?inicio=ISO&duracion=min) bien comprobados (HU-15 · SCRUM-114).
// Llegan de la URL, así que pueden traer cualquier cosa: se aceptan solo valores razonables y, si no,
// la pantalla usa los suyos (empieza ahora y dura 30 minutos).

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const DURACION_MAXIMA_MIN = 480; // una jornada

/** Duración en minutos: entera, entre 1 y 480. Si no, undefined (la de la pantalla). */
export function leerDuracion(valor: unknown): number | undefined {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return undefined;
  const minutos = Number(valor);
  return minutos >= 1 && minutos <= DURACION_MAXIMA_MIN ? minutos : undefined;
}

/** Hora de inicio: ISO, no en el futuro y dentro de la duración de la visita. Si no, undefined (ahora). */
export function leerInicio(
  valor: unknown,
  duracionMin: number,
  ahora: number = Date.now(),
): string | undefined {
  if (typeof valor !== "string" || !ISO.test(valor)) return undefined;
  const ms = Date.parse(valor);
  if (Number.isNaN(ms) || ms > ahora || ms < ahora - duracionMin * 60_000) return undefined;
  return new Date(ms).toISOString();
}
