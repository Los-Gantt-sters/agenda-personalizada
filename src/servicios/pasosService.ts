// Pasos de una tarea con su multimedia (SCRUM-96 · T-10.3, HU-10).
// - Lee y guarda los pasos con las funciones de la base de datos de T-10.1 (pasos_de_tarea y
//   guardar_pasos, en supabase/migrations/20261128200000_pasos_multimedia.sql).
// - Sube la foto, el vídeo y el audio de cada paso al bucket PRIVADO multimedia-pasos, ya
//   comprimidos y validados (compresionMultimedia.ts), y los enseña con URLs firmadas que caducan.
// - Al guardar, borra del bucket los archivos que el tutor ha cambiado o quitado, para no dejar
//   fotos de alumnos sueltas (RGPD).
// La pantalla del editor (28s) solo conoce RepositorioPasos: en la app lo cumple
// repositorioPasosSupabase y en la demo y las pruebas, el de memoria (componentes/pasos).
import { supabase } from "../lib/supabaseClient";
import type { PasoTarea, RecursoPaso } from "../componentes/agenda/tipos";
import { extensionDe, type ArchivoPreparado, type TipoMultimedia } from "./compresionMultimedia";

export const BUCKET_MULTIMEDIA_PASOS = "multimedia-pasos";
/** Las URLs firmadas duran 1 hora: lo que dura de sobra una tarea larga. */
export const SEGUNDOS_URL_FIRMADA = 60 * 60;

const FORMATOS_MULTIMEDIA = ["foto", "video", "audio"] as const;

/** Acceso a los pasos de una tarea desde el editor 28s. */
export interface RepositorioPasos {
  obtenerPasos(tareaId: string): Promise<PasoTarea[]>;
  /** «Guardar» (28s → 28ok): deja la tarea con estos pasos, en este orden. */
  guardarPasos(tareaId: string, pasos: PasoTarea[]): Promise<PasoTarea[]>;
  /** Sube la foto, el vídeo o el audio de un paso y devuelve el recurso para guardarlo con él. */
  subirMultimedia(
    tareaId: string,
    tipo: TipoMultimedia,
    archivo: ArchivoPreparado,
  ): Promise<RecursoPaso>;
  /**
   * Borra del bucket archivos subidos que al final no se guardan (el tutor cambia la foto antes de
   * «Guardar» o sale con «Atrás»), para no dejar archivos huérfanos con fotos de alumnos (RGPD).
   */
  borrarMultimedia(rutas: string[]): Promise<void>;
}

/** Nombre aleatorio para el archivo: no se puede adivinar y no lleva datos del alumno. */
function nombreAleatorio(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Ruta del archivo dentro del bucket: <tarea>/<foto|video|audio>/<aleatorio>.<ext> */
export function rutaMultimedia(tareaId: string, tipo: TipoMultimedia, tipoMime: string): string {
  return `${tareaId}/${tipo}/${nombreAleatorio()}.${extensionDe(tipoMime)}`;
}

/** Todas las rutas del bucket que usan unos pasos. */
export function rutasDePasos(pasos: PasoTarea[]): Set<string> {
  const rutas = new Set<string>();
  for (const p of pasos)
    for (const f of FORMATOS_MULTIMEDIA) {
      const ruta = p[f]?.ruta;
      if (ruta) rutas.add(ruta);
    }
  return rutas;
}

/**
 * Pone URL firmada a la foto, el vídeo y el audio de los pasos que vienen del bucket. Si no se
 * puede firmar (sin red, sin permiso), el recurso se queda con su ruta y `url: null`: 07 no lo
 * enseña, pero si el tutor guarda los pasos así, el archivo sigue guardado y no se borra.
 */
export async function firmarMultimediaPasos(pasos: PasoTarea[]): Promise<PasoTarea[]> {
  const rutas = [...rutasDePasos(pasos)];
  if (rutas.length === 0) return pasos;
  const firmadas = new Map<string, string>();
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_MULTIMEDIA_PASOS)
      .createSignedUrls(rutas, SEGUNDOS_URL_FIRMADA);
    if (!error)
      for (const f of data ?? []) if (f.path && f.signedUrl) firmadas.set(f.path, f.signedUrl);
  } catch {
    // Sin URLs: los pasos se ven igual, solo sin foto/vídeo/audio subidos
  }
  return pasos.map((p) => {
    const copia: PasoTarea = { ...p };
    for (const f of FORMATOS_MULTIMEDIA) {
      const r = p[f];
      if (r?.ruta) copia[f] = { ...r, url: firmadas.get(r.ruta) ?? null };
    }
    return copia;
  });
}

/** Lo que espera guardar_pasos de cada paso (ver la migración de T-10.1). */
export function pasoParaGuardar(p: PasoTarea): Record<string, unknown> {
  const recurso = (r: RecursoPaso | null | undefined) =>
    r && (r.ruta || r.url)
      ? {
          ruta: r.ruta ?? null,
          // Las URLs firmadas caducan: solo se guarda la URL si es externa (sin ruta en el bucket).
          url: r.ruta ? null : (r.url ?? null),
          tipo_mime: r.tipo_mime ?? null,
          tamano_bytes: r.tamano_bytes ?? null,
          duracion_segundos: r.duracion_segundos ?? null,
          descripcion: r.descripcion ?? null,
        }
      : null;
  return {
    id: p.id ?? null,
    titulo: (p.titulo ?? p.texto).trim(),
    texto: p.texto.trim(),
    pictograma_url: p.pictograma_url ?? null,
    pictograma_id: p.pictograma_id ?? null,
    pictograma_origen: p.pictograma_origen ?? "arasaac",
    foto: recurso(p.foto),
    video: recurso(p.video),
    audio: recurso(p.audio),
  };
}

export async function obtenerPasos(tareaId: string): Promise<PasoTarea[]> {
  const { data, error } = await supabase.rpc("pasos_de_tarea", { p_tarea: tareaId });
  if (error) throw error;
  return firmarMultimediaPasos((data ?? []) as PasoTarea[]);
}

/** Borra archivos del bucket. Si falla, no pasa nada grave: solo queda un archivo sin usar. */
export async function borrarMultimedia(rutas: string[]): Promise<void> {
  if (rutas.length === 0) return;
  try {
    await supabase.storage.from(BUCKET_MULTIMEDIA_PASOS).remove(rutas);
  } catch {
    // Se puede limpiar más tarde
  }
}

/**
 * Borra del bucket los archivos de tareas o alumnos que ya no existen (revisión de Jaime). La base de
 * datos los apunta en multimedia_por_borrar al borrar la tarea, pero solo la app puede borrarlos de
 * Storage. Lo hace la sesión de administración al abrir su panel; para cualquier otro no hace nada.
 * Devuelve cuántos archivos ha borrado.
 */
export async function limpiarMultimediaHuerfana(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("multimedia_huerfana");
    const rutas = (data ?? []) as string[];
    if (error || rutas.length === 0) return 0;
    const { error: errorBorrar } = await supabase.storage
      .from(BUCKET_MULTIMEDIA_PASOS)
      .remove(rutas);
    if (errorBorrar) return 0;
    await supabase.from("multimedia_por_borrar").delete().in("ruta", rutas);
    return rutas.length;
  } catch {
    // Se vuelve a intentar la próxima vez que entre administración
    return 0;
  }
}

export async function guardarPasos(tareaId: string, pasos: PasoTarea[]): Promise<PasoTarea[]> {
  // Archivos que había antes de guardar, para borrar después los que ya no se usan.
  let antes = new Set<string>();
  try {
    const { data } = await supabase.rpc("pasos_de_tarea", { p_tarea: tareaId });
    antes = rutasDePasos((data ?? []) as PasoTarea[]);
  } catch {
    // Si no se puede leer, simplemente no se limpia
  }

  const { error } = await supabase.rpc("guardar_pasos", {
    p_tarea: tareaId,
    p_pasos: pasos.map(pasoParaGuardar),
  });
  if (error) throw error;

  const ahora = rutasDePasos(pasos);
  await borrarMultimedia([...antes].filter((r) => !ahora.has(r)));
  return obtenerPasos(tareaId);
}

export async function subirMultimedia(
  tareaId: string,
  tipo: TipoMultimedia,
  archivo: ArchivoPreparado,
): Promise<RecursoPaso> {
  const ruta = rutaMultimedia(tareaId, tipo, archivo.tipoMime);
  const { error } = await supabase.storage
    .from(BUCKET_MULTIMEDIA_PASOS)
    .upload(ruta, archivo.blob, { contentType: archivo.tipoMime, upsert: false });
  if (error) throw error;
  const { data } = await supabase.storage
    .from(BUCKET_MULTIMEDIA_PASOS)
    .createSignedUrl(ruta, SEGUNDOS_URL_FIRMADA);
  return {
    ruta,
    url: data?.signedUrl ?? null,
    tipo_mime: archivo.tipoMime,
    tamano_bytes: archivo.tamanoBytes,
    duracion_segundos: archivo.duracionSegundos,
  };
}

export const repositorioPasosSupabase: RepositorioPasos = {
  obtenerPasos,
  guardarPasos,
  subirMultimedia,
  borrarMultimedia,
};
