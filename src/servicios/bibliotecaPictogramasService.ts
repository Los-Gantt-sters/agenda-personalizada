/**
 * Servicio de «Mi biblioteca · Mis pictogramas propios» (Pantalla 51 unificada)
 * con persistencia real en Supabase (`public.pictogramas_propios` con RLS por `auth.uid()`),
 * subida real de archivos de imagen a Supabase Storage (`pictogramas-propios`)
 * y aislamiento estricto por usuario y rol (SCRUM-241 / SCRUM-275 · T-51.1 / SCRUM-279 · T-51.2).
 */

import { urlImagenPictograma } from "../arasaac/urls";
import type { PictogramaBuscador28p } from "../componentes/tareas-personales/datosTareasPersonales";
import { supabase } from "../lib/supabaseClient";
import type {
  ActualizarPictogramaPropio51Input,
  ArchivoImagenSeleccionado51,
  CrearPictogramaPropio51Input,
  PictogramaPropio51,
  RolBibliotecaPictogramas51,
} from "../tipos/bibliotecaPictogramas";

export const BUCKET_PICTOGRAMAS_PROPIOS = "pictogramas-propios";

const DURACION_URL_FIRMADA_SEGUNDOS = 3600;

export const MENSAJE_INICIAL_SUBIDA_51 =
  "Pulsa directamente el icono «+» para subir un archivo propio";

export const MENSAJE_EXITO_SUBIDA_51 = "✓ Archivo propio seleccionado y adjuntado a tu biblioteca";

/**
 * Catálogo inicial de demostración del boceto `51.html` (usado únicamente en pruebas/previsualización
 * cuando no se carga desde base de datos).
 */
export const CATALOGO_INICIAL_PICTOGRAMAS_51: readonly PictogramaPropio51[] = [
  {
    id: "pic-tutor-1",
    owner: "tutor",
    palabraClave: "Grifo del aula (propio)",
    textoAlternativo: "Fotografía/pictograma del grifo real de Clase Triángulo",
    pictogramaId: 11737,
    imagenUrl: urlImagenPictograma(11737),
    creadoEn: "2026-11-20T09:00:00.000Z",
  },
  {
    id: "pic-tutor-2",
    owner: "tutor",
    palabraClave: "Toallitas Plan B",
    textoAlternativo: "Caja de toallitas húmedas del aula para Plan B",
    pictogramaId: 35743,
    imagenUrl: urlImagenPictograma(35743),
    creadoEn: "2026-11-20T09:10:00.000Z",
  },
  {
    id: "pic-tutor-3",
    owner: "tutor",
    palabraClave: "Rincón de la asamblea",
    textoAlternativo: "Fotografía de la alfombra de asamblea del aula",
    pictogramaId: 6980,
    imagenUrl: urlImagenPictograma(6980),
    creadoEn: "2026-11-20T09:20:00.000Z",
  },
  {
    id: "pic-familia-1",
    owner: "familia",
    palabraClave: "Mochila azul de Alejandro",
    textoAlternativo: "Mochila escolar de casa con llavero de león",
    pictogramaId: 2475,
    imagenUrl: urlImagenPictograma(2475),
    creadoEn: "2026-11-20T17:00:00.000Z",
  },
  {
    id: "pic-familia-2",
    owner: "familia",
    palabraClave: "Desayuno de casa",
    textoAlternativo: "Taza y tostadas del desayuno diario en casa",
    pictogramaId: 2462,
    imagenUrl: urlImagenPictograma(2462),
    creadoEn: "2026-11-20T17:10:00.000Z",
  },
  {
    id: "pic-familia-3",
    owner: "familia",
    palabraClave: "Dormitorio de Alejandro",
    textoAlternativo: "Fotografía de la habitación recogida en casa",
    pictogramaId: 6964,
    imagenUrl: urlImagenPictograma(6964),
    creadoEn: "2026-11-20T17:20:00.000Z",
  },
] as const;

let almacenPictogramas51: PictogramaPropio51[] = CATALOGO_INICIAL_PICTOGRAMAS_51.map((item) => ({
  ...item,
}));
let contadorSubidas51 = 1;

interface FilaPictogramaPropioBD {
  id: string;
  propietario_id: string;
  rol: RolBibliotecaPictogramas51;
  palabra_clave: string;
  texto_alternativo: string;
  imagen_url: string;
  ruta_storage: string | null;
  creado_en: string;
}

function mapearFilaBD(fila: FilaPictogramaPropioBD): PictogramaPropio51 {
  return {
    id: fila.id,
    propietarioId: fila.propietario_id,
    owner: fila.rol,
    palabraClave: fila.palabra_clave,
    textoAlternativo: fila.texto_alternativo,
    pictogramaId: 0,
    imagenUrl: fila.imagen_url,
    rutaStorage: fila.ruta_storage,
    creadoEn: fila.creado_en,
  };
}

function sanitizarNombreArchivo(nombre: string): string {
  return (
    nombre
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "pictograma.png"
  );
}

/**
 * Abre el selector nativo de archivos de imagen del navegador (en Web) para elegir
 * un archivo real desde el dispositivo al pulsar el recuadro punteado «+».
 * @returns Archivo seleccionado o `null` si el usuario cancela
 */
export function seleccionarArchivoImagenPropio(): Promise<ArchivoImagenSeleccionado51 | null> {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      resolve({
        archivo: file,
        nombreArchivo: file.name || "pictograma.png",
        tipoMime: file.type || "image/png",
      });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Carga desde Supabase (`public.pictogramas_propios`) los pictogramas propios del usuario autenticado
 * para el rol activo (`tutor` o `familia`). La política RLS `propietario_id = auth.uid()` garantiza
 * el aislamiento estricto por usuario en base de datos.
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @returns Lista de pictogramas propios persistidos del usuario autenticado
 */
export async function cargarPictogramasPropiosDesdeBD(
  rol: RolBibliotecaPictogramas51,
): Promise<PictogramaPropio51[]> {
  const { data, error } = await supabase
    .from("pictogramas_propios")
    .select(
      "id, propietario_id, rol, palabra_clave, texto_alternativo, imagen_url, ruta_storage, creado_en",
    )
    .eq("rol", rol)
    .order("creado_en", { ascending: false });

  if (error) {
    throw new Error(`No se pudo cargar tu biblioteca de pictogramas: ${error.message}`);
  }

  const filas = (data ?? []) as FilaPictogramaPropioBD[];
  const resultados = await Promise.all(
    filas.map(async (fila) => {
      const mapeado = mapearFilaBD(fila);
      if (fila.ruta_storage) {
        const { data: firmada } = await supabase.storage
          .from(BUCKET_PICTOGRAMAS_PROPIOS)
          .createSignedUrl(fila.ruta_storage, DURACION_URL_FIRMADA_SEGUNDOS);
        if (firmada?.signedUrl) {
          mapeado.imagenUrl = firmada.signedUrl;
        }
      }
      return mapeado;
    }),
  );

  return resultados;
}

/**
 * Sube un archivo de imagen real a Supabase Storage (`pictogramas-propios/<uid>/...`)
 * y registra el pictograma propio en `public.pictogramas_propios` asociado al `auth.uid()` actual.
 * @param input Datos del archivo real seleccionado, rol y metadatos de texto
 * @returns Pictograma propio persistido en base de datos con su URL pública real
 */
export async function subirArchivoPictogramaPropio51(input: {
  owner: RolBibliotecaPictogramas51;
  archivo: Blob;
  nombreArchivo: string;
  tipoMime: string;
  palabraClave?: string;
  textoAlternativo?: string;
}): Promise<PictogramaPropio51> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (userError || !userId) {
    throw new Error("Debes iniciar sesión para subir un pictograma propio a tu biblioteca.");
  }

  const nombreBase = input.nombreArchivo.replace(/\.[^/.]+$/, "").trim();
  const palabraClave = input.palabraClave?.trim() || nombreBase || "Pictograma propio";
  const textoAlternativo = input.textoAlternativo?.trim() || `Imagen propia: ${palabraClave}`;
  const nombreSeguro = sanitizarNombreArchivo(input.nombreArchivo);
  const rutaStorage = `${userId}/${Date.now()}-${nombreSeguro}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_PICTOGRAMAS_PROPIOS)
    .upload(rutaStorage, input.archivo, {
      contentType: input.tipoMime || "image/png",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`No se pudo subir el archivo a Storage: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET_PICTOGRAMAS_PROPIOS)
    .createSignedUrl(rutaStorage, DURACION_URL_FIRMADA_SEGUNDOS);

  const imagenUrl = signedData?.signedUrl;
  if (signedError || !imagenUrl) {
    throw new Error(
      `No se pudo generar la URL firmada del archivo subido: ${signedError?.message ?? "error desconocido"}`,
    );
  }

  const { data: filaInsertada, error: insertError } = await supabase
    .from("pictogramas_propios")
    .insert({
      propietario_id: userId,
      rol: input.owner,
      palabra_clave: palabraClave,
      texto_alternativo: textoAlternativo,
      imagen_url: imagenUrl,
      ruta_storage: rutaStorage,
    })
    .select(
      "id, propietario_id, rol, palabra_clave, texto_alternativo, imagen_url, ruta_storage, creado_en",
    )
    .single();

  if (insertError || !filaInsertada) {
    throw new Error(
      `No se pudo guardar el pictograma en base de datos: ${insertError?.message ?? "error desconocido"}`,
    );
  }

  return mapearFilaBD(filaInsertada as FilaPictogramaPropioBD);
}

/**
 * Actualiza palabra clave y texto alternativo de un pictograma propio en Supabase (`public.pictogramas_propios`).
 * @param input Identificador y campos actualizados
 * @returns Pictograma actualizado
 */
export async function actualizarPictogramaPropioEnBD51(
  input: ActualizarPictogramaPropio51Input,
): Promise<PictogramaPropio51> {
  const { data, error } = await supabase
    .from("pictogramas_propios")
    .update({
      ...(input.palabraClave ? { palabra_clave: input.palabraClave.trim() } : {}),
      ...(input.textoAlternativo ? { texto_alternativo: input.textoAlternativo.trim() } : {}),
    })
    .eq("id", input.id)
    .eq("rol", input.owner)
    .select(
      "id, propietario_id, rol, palabra_clave, texto_alternativo, imagen_url, ruta_storage, creado_en",
    )
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo actualizar el pictograma propio: ${error?.message ?? "sin permisos"}`,
    );
  }

  return mapearFilaBD(data as FilaPictogramaPropioBD);
}

/**
 * Elimina un pictograma propio de Supabase (`public.pictogramas_propios`) y su archivo en Storage.
 * @param id Identificador UUID del pictograma
 * @param rol Rol activo
 * @param rutaStorage Ruta opcional en el bucket para borrar también el archivo
 */
export async function eliminarPictogramaPropioEnBD51(
  id: string,
  rol: RolBibliotecaPictogramas51,
  rutaStorage?: string | null,
): Promise<void> {
  const { error } = await supabase.from("pictogramas_propios").delete().eq("id", id).eq("rol", rol);

  if (error) {
    throw new Error(`No se pudo eliminar el pictograma propio: ${error.message}`);
  }

  if (rutaStorage) {
    await supabase.storage.from(BUCKET_PICTOGRAMAS_PROPIOS).remove([rutaStorage]);
  }
}

/**
 * Filtra la lista de pictogramas propios aislando estrictamente por el rol activo (`tutor` o `familia`)
 * y opcionalmente por un término de búsqueda en palabra clave o texto alternativo.
 * @param pictogramas Lista completa de pictogramas propios
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param busqueda Texto opcional de filtrado
 * @returns Lista de pictogramas propios pertenecientes exclusivamente al rol indicado
 */
export function filtrarPictogramasPorRol51(
  pictogramas: readonly PictogramaPropio51[],
  rol: RolBibliotecaPictogramas51,
  busqueda: string = "",
): PictogramaPropio51[] {
  const termino = busqueda.trim().toLowerCase();
  return pictogramas.filter((item) => {
    if (item.owner !== rol) return false;
    if (termino.length > 0) {
      return (
        item.palabraClave.toLowerCase().includes(termino) ||
        item.textoAlternativo.toLowerCase().includes(termino)
      );
    }
    return true;
  });
}

/**
 * Obtiene los pictogramas propios en caché local únicamente para el rol activo (`tutor` o `familia`).
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @returns Copia de los pictogramas propios de ese rol
 */
export function obtenerPictogramasPropiosPorRol51(
  rol: RolBibliotecaPictogramas51,
): PictogramaPropio51[] {
  return filtrarPictogramasPorRol51(almacenPictogramas51, rol).map((item) => ({ ...item }));
}

/**
 * Sube un pictograma propio al pulsar el recuadro punteado «+»:
 * si recibe un archivo real (`archivo`), lo sube a Supabase Storage y lo guarda en `pictogramas_propios`.
 * @param input Datos del archivo propio y rol propietario
 * @returns Nuevo pictograma propio creado
 */
export async function subirPictogramaPropioAlPulsarMas(
  input: CrearPictogramaPropio51Input,
): Promise<PictogramaPropio51> {
  if (input.archivo) {
    const persistido = await subirArchivoPictogramaPropio51({
      owner: input.owner,
      archivo: input.archivo,
      nombreArchivo: input.archivoNombre ?? "pictograma.png",
      tipoMime: input.tipoMime ?? "image/png",
      palabraClave: input.palabraClave,
      textoAlternativo: input.textoAlternativo,
    });
    almacenPictogramas51 = [persistido, ...almacenPictogramas51];
    return persistido;
  }

  const idNuevo = `pic-${input.owner}-propio-${contadorSubidas51++}`;
  const palabraPorDefecto =
    input.owner === "familia"
      ? "Rincón de lectura en casa (propio)"
      : "Bandeja de desayuno del aula (propio)";
  const textoAltPorDefecto =
    input.owner === "familia"
      ? "Fotografía propia subida por la familia desde el recuadro +"
      : "Fotografía propia subida por el tutor desde el recuadro +";

  const nuevo: PictogramaPropio51 = {
    id: idNuevo,
    owner: input.owner,
    palabraClave: input.palabraClave?.trim() || palabraPorDefecto,
    textoAlternativo: input.textoAlternativo?.trim() || textoAltPorDefecto,
    pictogramaId: input.pictogramaId ?? (input.owner === "familia" ? 2450 : 2433),
    imagenUrl:
      input.imagenUrl?.trim() ||
      urlImagenPictograma(input.pictogramaId ?? (input.owner === "familia" ? 2450 : 2433)),
    creadoEn: new Date().toISOString(),
  };

  almacenPictogramas51 = [nuevo, ...almacenPictogramas51];
  return { ...nuevo };
}

/**
 * Edita la palabra clave o el texto alternativo de un pictograma propio en memoria verificando el rol.
 * @param input Datos de actualización con `id` y `owner`
 * @returns Pictograma actualizado
 */
export function editarPictogramaPropio51(
  input: ActualizarPictogramaPropio51Input,
): PictogramaPropio51 {
  const idx = almacenPictogramas51.findIndex((item) => item.id === input.id);
  if (idx < 0) {
    throw new Error("No se encontró el pictograma propio solicitado.");
  }
  const actual = almacenPictogramas51[idx];
  if (actual.owner !== input.owner) {
    throw new Error("No tienes permiso para modificar un pictograma propio de otro rol.");
  }

  const actualizado: PictogramaPropio51 = {
    ...actual,
    palabraClave: input.palabraClave?.trim() || actual.palabraClave,
    textoAlternativo: input.textoAlternativo?.trim() || actual.textoAlternativo,
  };
  almacenPictogramas51[idx] = actualizado;
  return { ...actualizado };
}

/**
 * Elimina un pictograma propio en memoria verificando el aislamiento por rol.
 * @param id Identificador del pictograma a quitar
 * @param rol Rol activo que solicita el borrado
 * @returns Lista actualizada de pictogramas propios del rol activo
 */
export function eliminarPictogramaPropio51(
  id: string,
  rol: RolBibliotecaPictogramas51,
): PictogramaPropio51[] {
  const objetivo = almacenPictogramas51.find((item) => item.id === id);
  if (!objetivo) {
    throw new Error("No se encontró el pictograma propio a eliminar.");
  }
  if (objetivo.owner !== rol) {
    throw new Error("No tienes permiso para eliminar un pictograma propio de otro rol.");
  }
  almacenPictogramas51 = almacenPictogramas51.filter((item) => item.id !== id);
  return obtenerPictogramasPropiosPorRol51(rol);
}

/**
 * Convierte los pictogramas propios de un rol al formato `PictogramaBuscador28p`
 * para que aparezcan junto a los de ARASAAC en el buscador unificado (Pantalla 28p).
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param pictogramas Lista opcional de pictogramas
 * @returns Elementos con `fuente: "mio"` y `etiquetaFuente: "Mi biblioteca"`
 */
export function convertirPictogramasPropiosABuscador28p(
  rol: RolBibliotecaPictogramas51,
  pictogramas: readonly PictogramaPropio51[] = almacenPictogramas51,
): PictogramaBuscador28p[] {
  return filtrarPictogramasPorRol51(pictogramas, rol).map((item) => ({
    id: item.id,
    titulo: item.palabraClave,
    fuente: "mio",
    etiquetaFuente: "Mi biblioteca",
    pictogramaId: item.pictogramaId,
    pictogramaUrl: item.imagenUrl,
  }));
}

/**
 * Restaura el catálogo en memoria de la Pantalla 51 a los 6 pictogramas iniciales del prototipo.
 */
export function reiniciarBibliotecaPictogramas51(): void {
  almacenPictogramas51 = CATALOGO_INICIAL_PICTOGRAMAS_51.map((item) => ({ ...item }));
  contadorSubidas51 = 1;
}
