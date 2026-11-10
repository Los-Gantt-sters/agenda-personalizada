// Direcciones públicas de ARASAAC (https://arasaac.org/developers/api).

export const URL_API_ARASAAC = "https://api.arasaac.org/v1";
export const URL_IMAGENES_ARASAAC = "https://static.arasaac.org/pictograms";
export const IDIOMA_POR_DEFECTO = "es";

/** Tamaño por defecto: 500 px sirve para pantallas de tableta sin pesar demasiado. */
export const TAMANO_POR_DEFECTO = 500;

const TAMANOS_VALIDOS = [300, 500, 2500];

export function esIdentificadorValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

/** Dirección de la imagen de un pictograma, p. ej. https://static.arasaac.org/pictograms/6964/6964_500.png */
export function urlImagenPictograma(id: number, tamano: number = TAMANO_POR_DEFECTO): string {
  if (!esIdentificadorValido(id)) {
    throw new RangeError(`Identificador de pictograma no válido: ${String(id)}`);
  }
  if (!TAMANOS_VALIDOS.includes(tamano)) {
    throw new RangeError(`Tamaño de pictograma no válido: ${tamano}`);
  }
  return `${URL_IMAGENES_ARASAAC}/${id}/${id}_${tamano}.png`;
}
