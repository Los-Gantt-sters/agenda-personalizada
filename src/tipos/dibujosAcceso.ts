// Dibujos con los que el alumnado entra en la app (HU-01, prototipo 03-04).
// El `nombre` es lo que se envía a Supabase Auth: minúsculas, sin tildes ni espacios.
// De momento son emojis, como el resto del login; se cambiarán por pictogramas de ARASAAC (T-04.2).

export interface DibujoAcceso {
  /** Identificador que forma la contraseña, p. ej. "manzana". */
  nombre: string;
  emoji: string;
  /** Nombre en Lectura Fácil para el lector de pantalla. */
  etiqueta: string;
}

/** Número de dibujos que forman la secuencia de acceso. */
export const LONGITUD_SECUENCIA = 3;

export const DIBUJOS_ACCESO: DibujoAcceso[] = [
  { nombre: "manzana", emoji: "🍎", etiqueta: "Manzana" },
  { nombre: "perro", emoji: "🐶", etiqueta: "Perro" },
  { nombre: "estrella", emoji: "⭐", etiqueta: "Estrella" },
  { nombre: "sol", emoji: "🌞", etiqueta: "Sol" },
  { nombre: "coche", emoji: "🚗", etiqueta: "Coche" },
  { nombre: "casa", emoji: "🏠", etiqueta: "Casa" },
  { nombre: "arcoiris", emoji: "🌈", etiqueta: "Arcoíris" },
  { nombre: "gato", emoji: "🐱", etiqueta: "Gato" },
  { nombre: "balon", emoji: "⚽", etiqueta: "Balón" },
];
