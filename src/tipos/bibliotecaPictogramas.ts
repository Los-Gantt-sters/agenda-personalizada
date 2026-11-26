/**
 * Tipos de dominio para la Pantalla 51 unificada («Mi biblioteca · Mis pictogramas propios»)
 * para Tutor y Familia con aislamiento estricto por usuario/rol (RLS) y subida real al pulsar «+»
 * (SCRUM-241 / SCRUM-275 / SCRUM-279).
 */

export type RolBibliotecaPictogramas51 = "tutor" | "familia";

export interface ArchivoImagenSeleccionado51 {
  /** Archivo o Blob real seleccionado por el usuario. */
  archivo: Blob;
  /** Nombre original del archivo seleccionado (p. ej. `"grifo_aula.png"`). */
  nombreArchivo: string;
  /** Tipo MIME de la imagen (p. ej. `"image/png"`, `"image/jpeg"`). */
  tipoMime: string;
}

export interface PictogramaPropio51 {
  /** Identificador único del pictograma propio (UUID en Supabase). */
  id: string;
  /** Identificador del usuario propietario en `auth.users` (aislamiento por usuario en BD). */
  propietarioId?: string;
  /** Propietario/ámbito estricto: `"tutor"` (escolar) o `"familia"` (hogar). */
  owner: RolBibliotecaPictogramas51;
  /** Palabra clave principal mostrada en la columna PALABRA CLAVE y en el buscador 28p. */
  palabraClave: string;
  /** Descripción accesible mostrada en la columna TEXTO ALTERNATIVO. */
  textoAlternativo: string;
  /** ID de pictograma ARASAAC de referencia opcional. */
  pictogramaId: number;
  /** URL pública de la imagen real subida a Supabase Storage. */
  imagenUrl: string;
  /** Ruta interna en el bucket `pictogramas-propios` para borrado en Storage. */
  rutaStorage?: string | null;
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
  archivo?: Blob;
  tipoMime?: string;
}

export interface ActualizarPictogramaPropio51Input {
  id: string;
  owner: RolBibliotecaPictogramas51;
  palabraClave?: string;
  textoAlternativo?: string;
}
