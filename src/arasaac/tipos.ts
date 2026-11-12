// Tipos del módulo de pictogramas de ARASAAC (T-04.2, HU-04).

/** Tamaños de imagen que publica ARASAAC (píxeles de lado). */
export type TamanoPictograma = 300 | 500 | 2500;

/**
 * Pictograma del catálogo. Recoge lo que pide RI16.1 (identificador de ARASAAC, palabra clave y
 * dirección de la imagen) y la descripción alternativa que exigen RI5.4 y RF14.7.
 */
export interface PictogramaArasaac {
  /** Identificador oficial en ARASAAC. */
  id: number;
  /** Palabra clave principal en el idioma de la búsqueda. */
  palabraClave: string;
  /** Todas las palabras clave que ARASAAC asocia al pictograma. */
  palabrasClave: string[];
  /** Dirección de la imagen (PNG) en el servidor de ARASAAC. */
  urlImagen: string;
  /** Texto alternativo para lectores de pantalla. */
  descripcion: string;
  /** Categorías de ARASAAC (en inglés, tal como las publica la API). */
  categorias: string[];
  /** Símbolo equivalente usado en el prototipo HTML (p. ej. "🎒"), útil como puente y respaldo. */
  simbolo?: string;
}

/** Actividad predefinida dentro de una categoría del asistente del estudiante (prototipos 19 y 20). */
export interface ActividadCategoria {
  titulo: string;
  pictograma: PictogramaArasaac;
}

/** Categoría visual para crear tareas sin teclado (RF5.10, prototipos 19 y 20). */
export interface CategoriaPictogramas {
  nombre: string;
  pictograma: PictogramaArasaac;
  actividades: readonly ActividadCategoria[];
}

/** Recurso de la Biblioteca de Recursos Accesibles de administración (RF14.6, RF14.7, prototipo 66). */
export interface RecursoBibliotecaArasaac {
  pictograma: PictogramaArasaac;
  origen: "ARASAAC" | "Propio";
  palabrasClaveTexto: string;
  descripcionAlternativa: string;
}

export type CodigoErrorArasaac =
  | "termino_invalido"
  | "identificador_invalido"
  | "sin_conexion"
  | "tiempo_agotado"
  | "cancelada"
  | "error_servidor"
  | "respuesta_invalida";

/** Error del módulo, con un mensaje corto en Lectura Fácil apto para enseñar al usuario. */
export class ErrorArasaac extends Error {
  readonly codigo: CodigoErrorArasaac;
  readonly mensajeUsuario: string;

  constructor(codigo: CodigoErrorArasaac, detalle?: string) {
    super(detalle ?? codigo);
    this.name = "ErrorArasaac";
    this.codigo = codigo;
    this.mensajeUsuario = MENSAJES_USUARIO[codigo];
  }
}

const MENSAJES_USUARIO: Record<CodigoErrorArasaac, string> = {
  termino_invalido: "Escribe al menos dos letras para buscar.",
  identificador_invalido: "Ese dibujo no existe.",
  sin_conexion: "No hay internet. Inténtalo otra vez.",
  tiempo_agotado: "Está tardando mucho. Inténtalo otra vez.",
  cancelada: "La búsqueda se ha parado.",
  error_servidor: "Ahora no podemos buscar dibujos. Inténtalo más tarde.",
  respuesta_invalida: "Ahora no podemos buscar dibujos. Inténtalo más tarde.",
};
