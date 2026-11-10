// Colores y medidas de la agenda del día (T-06.1, HU-06).
// Usa los mismos nombres y valores que el tema «claro» de src/temas/paletas.ts (SCRUM-64), así que
// cuando esa rama llegue a main basta con cambiar este objeto por useTema().colores.

export const colores = {
  /** Fondo general de la pantalla. */
  fondo: "#F7FAFC",
  /** Fondo de los bloques y tarjetas. */
  superficie: "#FFFFFF",
  /** Fondo del bloque «Ahora». */
  superficieDestacada: "#E3EDFB",
  /** Fondo de las tarjetas pequeñas de «Hecho» y «Después». */
  superficieSuave: "#EEF2F8",
  texto: "#1A202C",
  textoSecundario: "#4A5568",
  primario: "#2B6CB0",
  textoSobrePrimario: "#FFFFFF",
  borde: "#718096",
  exito: "#276749",
  aviso: "#8A5A00",
};

/** Radio de las esquinas de los bloques (prototipo, variante A · Franjas). */
export const RADIO = 22;
