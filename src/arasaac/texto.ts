// Utilidades de texto para buscar sin que importen mayúsculas, tildes ni espacios sobrantes.

/** Pasa a minúsculas, quita tildes (conserva la ñ) y colapsa espacios. */
export function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .replace(/ñ/g, "\u0001")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0001/g, "ñ")
    .replace(/\s+/g, " ");
}

/** Texto de búsqueda para la API: solo recorta y colapsa espacios (la API ya ignora mayúsculas). */
export function limpiarTermino(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}
