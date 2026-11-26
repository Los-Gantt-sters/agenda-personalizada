/**
 * Tipos de dominio para la Pantalla 51 unificada («Mi biblioteca · Mis pictogramas propios»)
 * para Tutor y Familia con aislamiento estricto por rol y subida directa al pulsar «+»
 * (SCRUM-241 / SCRUM-275 / SCRUM-279).
 */

export type RolBibliotecaPictogramas51 = "tutor" | "familia";

export interface PictogramaPropio51 {
  /** Identificador único del pictograma propio. */
  id: string;
  /** Propietario/ámbito estricto: `"tutor"` (escolar) o `"familia"` (hogar). */
  owner: RolBibliotecaPictogramas51;
  /** Palabra clave principal mostrada en la columna PALABRA CLAVE y en el buscador 28p. */
  palabraClave: string;
  /** Descripción accesible mostrada en la columna TEXTO ALTERNATIVO. */
  textoAlternativo: string;
  /** ID de pictograma ARASAAC de referencia o respaldo visual. */
  pictogramaId: number;
  /** URL de la imagen o archivo subido al almacenamiento. */
  imagenUrl: string;
  /** Marca temporal ISO de creación. */
  creadoEn: string;
}

export interface CrearPictogramaPropio51Input {
  owner: RolBibliotecaPictogramas51;
  palabraClave?: string;
  textoAlternativo?: string;
  pictogramaId?: number;
  imagenUrl?: string;
  archivoNombre?: string;
}

export interface ActualizarPictogramaPropio51Input {
  id: string;
  owner: RolBibliotecaPictogramas51;
  palabraClave?: string;
  textoAlternativo?: string;
}
