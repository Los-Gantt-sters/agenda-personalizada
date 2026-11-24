// Compresión y validación de la foto, el vídeo y el audio de un paso antes de subirlos
// (SCRUM-96 · T-10.3, HU-10, editor 28s).
// - Foto: se reduce a 1280 px por el lado largo y se guarda como JPEG al 80 %. Una foto de móvil
//   (4-8 MB) queda en unos 150-400 KB, que cargan rápido en la tableta del alumno.
// - Vídeo y audio: el navegador no puede recomprimirlos sin librerías pesadas, así que se limitan
//   por tipo, tamaño y duración (vídeo corto, 07d). El bucket también tiene límite de tamaño y tipos
//   (supabase/migrations/20261124100000_storage_multimedia_pasos.sql).
// La compresión funciona en web, que es donde se usa el editor; en la app nativa se sube tal cual.
import { Platform } from "react-native";

export type TipoMultimedia = "foto" | "video" | "audio";

export interface LimitesMultimedia {
  tiposMime: readonly string[];
  /** Tamaño máximo del archivo que se sube, en bytes. */
  maxBytes: number;
  /** Duración máxima en segundos (vídeo y audio). */
  maxSegundos?: number;
}

const MB = 1024 * 1024;

export const LIMITES: Record<TipoMultimedia, LimitesMultimedia> = {
  foto: { tiposMime: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * MB },
  video: {
    tiposMime: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 50 * MB,
    maxSegundos: 60,
  },
  audio: {
    tiposMime: [
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
      "audio/webm",
      "audio/ogg",
      "audio/wav",
    ],
    maxBytes: 10 * MB,
    maxSegundos: 120,
  },
};

/** Lado largo máximo de una foto ya comprimida. */
export const LADO_MAX_FOTO = 1280;
/** Calidad JPEG de la foto comprimida (0-1). */
export const CALIDAD_FOTO = 0.8;

/** Fotos más grandes que esto (antes de comprimir) ni se intentan abrir. */
const MAX_BYTES_FOTO_ORIGINAL = 25 * MB;

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

/** Extensión de archivo para un tipo MIME («bin» si no se conoce). */
export function extensionDe(tipoMime: string): string {
  return EXTENSIONES[tipoMime.split(";")[0].trim().toLowerCase()] ?? "bin";
}

/** El tipo MIME sin parámetros («audio/webm;codecs=opus» → «audio/webm»). */
export function mimeBase(tipoMime: string): string {
  return tipoMime.split(";")[0].trim().toLowerCase();
}

/**
 * Medidas de la foto reducida para que su lado largo no pase de `ladoMax`, sin deformarla.
 * Las fotos pequeñas se quedan como están.
 */
export function medidasReducidas(
  ancho: number,
  alto: number,
  ladoMax: number = LADO_MAX_FOTO,
): { ancho: number; alto: number } {
  const lado = Math.max(ancho, alto);
  if (lado <= ladoMax || lado <= 0) return { ancho, alto };
  const escala = ladoMax / lado;
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

/** Texto corto para el tutor con un tamaño en bytes («350 KB», «12,5 MB»). */
export function textoTamano(bytes: number): string {
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Comprueba que el archivo se puede guardar como `tipo`. Devuelve el motivo en Lectura Fácil si no
 * se puede, o null si está bien.
 */
export function validarMultimedia(
  tipo: TipoMultimedia,
  archivo: { tipoMime: string; tamanoBytes: number; duracionSegundos?: number | null },
): string | null {
  const limites = LIMITES[tipo];
  const nombre = tipo === "foto" ? "La foto" : tipo === "video" ? "El vídeo" : "El audio";
  if (!limites.tiposMime.includes(mimeBase(archivo.tipoMime))) {
    const validos =
      tipo === "foto"
        ? "JPG, PNG o WEBP"
        : tipo === "video"
          ? "MP4, WEBM o MOV"
          : "MP3, M4A o WEBM";
    return `${nombre} tiene que ser ${validos}.`;
  }
  if (archivo.tamanoBytes <= 0) return `${nombre} está vacío.`;
  if (archivo.tamanoBytes > limites.maxBytes) {
    return `${nombre} es demasiado grande (${textoTamano(archivo.tamanoBytes)}). Máximo ${textoTamano(limites.maxBytes)}.`;
  }
  if (
    limites.maxSegundos !== undefined &&
    archivo.duracionSegundos != null &&
    archivo.duracionSegundos > limites.maxSegundos
  ) {
    return `${nombre} es demasiado largo (${Math.round(archivo.duracionSegundos)} s). Máximo ${limites.maxSegundos} s.`;
  }
  return null;
}

/** Archivo listo para subir. */
export interface ArchivoPreparado {
  blob: Blob;
  tipoMime: string;
  tamanoBytes: number;
  duracionSegundos: number | null;
}

/**
 * Comprime la foto (solo en web). Si no se puede (formato raro, navegador antiguo, app nativa),
 * devuelve la original: la validación decide después si se puede subir.
 */
export async function comprimirFoto(original: Blob): Promise<Blob> {
  if (Platform.OS !== "web" || typeof document === "undefined") return original;
  if (original.size > MAX_BYTES_FOTO_ORIGINAL) return original;
  try {
    const imagen = await createImageBitmap(original);
    const { ancho, alto } = medidasReducidas(imagen.width, imagen.height);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return original;
    // Fondo blanco: los PNG con transparencia no quedan negros al pasarlos a JPEG.
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    imagen.close?.();
    const comprimida = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", CALIDAD_FOTO),
    );
    // Si por lo que sea pesa más que la original (foto ya pequeña), se queda la original.
    return comprimida && comprimida.size < original.size ? comprimida : original;
  } catch {
    return original;
  }
}

/** Duración en segundos de un vídeo o audio (solo en web; null si no se sabe). */
export function leerDuracion(archivo: Blob, tipo: "video" | "audio"): Promise<number | null> {
  if (Platform.OS !== "web" || typeof document === "undefined" || typeof URL === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolver) => {
    const url = URL.createObjectURL(archivo);
    const medio = document.createElement(tipo);
    let hecho = false;
    const terminar = (valor: number | null) => {
      if (hecho) return;
      hecho = true;
      URL.revokeObjectURL(url);
      resolver(valor);
    };
    medio.preload = "metadata";
    medio.onloadedmetadata = () =>
      terminar(Number.isFinite(medio.duration) ? Math.round(medio.duration) : null);
    medio.onerror = () => terminar(null);
    setTimeout(() => terminar(null), 5000);
    medio.src = url;
  });
}

/**
 * Prepara un archivo elegido en el editor 28s: comprime la foto, mide la duración del vídeo o
 * audio y lo valida. Devuelve el archivo listo o el error para enseñar al tutor.
 */
export async function prepararMultimedia(
  tipo: TipoMultimedia,
  archivo: Blob,
): Promise<{ ok: true; archivo: ArchivoPreparado } | { ok: false; error: string }> {
  const tipoOriginal = mimeBase(archivo.type || "");
  if (!LIMITES[tipo].tiposMime.includes(tipoOriginal)) {
    return {
      ok: false,
      error: validarMultimedia(tipo, { tipoMime: tipoOriginal, tamanoBytes: archivo.size })!,
    };
  }
  const blob = tipo === "foto" ? await comprimirFoto(archivo) : archivo;
  const tipoMime = mimeBase(blob.type || tipoOriginal);
  const duracionSegundos = tipo === "foto" ? null : await leerDuracion(blob, tipo);
  const error = validarMultimedia(tipo, { tipoMime, tamanoBytes: blob.size, duracionSegundos });
  if (error) return { ok: false, error };
  return { ok: true, archivo: { blob, tipoMime, tamanoBytes: blob.size, duracionSegundos } };
}
