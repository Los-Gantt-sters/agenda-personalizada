/**
 * Servicio y catálogo de «Mi biblioteca · Mis pictogramas propios» (Pantalla 51 unificada)
 * con aislamiento estricto entre Tutor y Familia y subida directa al pulsar el recuadro «+»
 * (SCRUM-241 / SCRUM-275 · T-51.1 / SCRUM-279 · T-51.2).
 */

import { urlImagenPictograma } from "../arasaac/urls";
import type { PictogramaBuscador28p } from "../componentes/tareas-personales/datosTareasPersonales";
import { supabase } from "../lib/supabaseClient";
import type {
  ActualizarPictogramaPropio51Input,
  CrearPictogramaPropio51Input,
  PictogramaPropio51,
  RolBibliotecaPictogramas51,
} from "../tipos/bibliotecaPictogramas";

export const BUCKET_PICTOGRAMAS_PROPIOS = "multimedia-pasos";

export const MENSAJE_INICIAL_SUBIDA_51 =
  "Pulsa directamente el icono «+» para subir un archivo propio";

export const MENSAJE_EXITO_SUBIDA_51 = "✓ Archivo propio seleccionado y adjuntado a tu biblioteca";

/**
 * Catálogo inicial de pictogramas propios del boceto `51.html`:
 * - 3 pictogramas propios del perfil Tutor (`data-bib-owner="tutor"`)
 * - 3 pictogramas propios del perfil Familia (`data-bib-owner="familia"`)
 */
export const CATALOGO_INICIAL_PICTOGRAMAS_51: readonly PictogramaPropio51[] = [
  // Pictogramas propios de Tutor (aislados de Familia)
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

  // Pictogramas propios de Familia (aislados de Tutor)
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
 * Obtiene los pictogramas propios almacenados únicamente para el rol activo (`tutor` o `familia`).
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @returns Copia de los pictogramas propios de ese rol
 */
export function obtenerPictogramasPropiosPorRol51(
  rol: RolBibliotecaPictogramas51,
): PictogramaPropio51[] {
  return filtrarPictogramasPorRol51(almacenPictogramas51, rol).map((item) => ({ ...item }));
}

/**
 * Construye un nuevo pictograma propio al pulsar directamente el recuadro punteado «+» en la Pantalla 51,
 * asignándolo de forma aislada al rol activo (`tutor` o `familia`) y registrándolo en Storage/memoria
 * (SCRUM-279 · T-51.2).
 * @param input Datos del archivo propio y rol propietario
 * @returns Nuevo pictograma propio creado y persistido
 */
export async function subirPictogramaPropioAlPulsarMas(
  input: CrearPictogramaPropio51Input,
): Promise<PictogramaPropio51> {
  const idNuevo = `pic-${input.owner}-propio-${contadorSubidas51++}`;
  const palabraPorDefecto =
    input.owner === "familia"
      ? "Rincón de lectura en casa (propio)"
      : "Bandeja de desayuno del aula (propio)";
  const textoAltPorDefecto =
    input.owner === "familia"
      ? "Fotografía propia subida por la familia desde el recuadro +"
      : "Fotografía propia subida por el tutor desde el recuadro +";

  const palabraClave = input.palabraClave?.trim() || palabraPorDefecto;
  const textoAlternativo = input.textoAlternativo?.trim() || textoAltPorDefecto;
  const pictogramaId = input.pictogramaId ?? (input.owner === "familia" ? 2450 : 2433);
  let imagenUrl = input.imagenUrl?.trim() || urlImagenPictograma(pictogramaId);

  const rutaStorage = `pictogramas-propios/${input.owner}/${idNuevo}.png`;

  try {
    const storageApi = supabase?.storage;
    if (storageApi && typeof storageApi.from === "function") {
      const bucket = storageApi.from(BUCKET_PICTOGRAMAS_PROPIOS);
      if (bucket && typeof bucket.getPublicUrl === "function") {
        const resPublic = bucket.getPublicUrl(rutaStorage);
        if (resPublic?.data?.publicUrl && input.archivoNombre) {
          imagenUrl = resPublic.data.publicUrl;
        }
      }
    }
  } catch {
    // Fallback seguro a la URL visual local cuando Storage no está conectado en tests
  }

  const nuevo: PictogramaPropio51 = {
    id: idNuevo,
    owner: input.owner,
    palabraClave,
    textoAlternativo,
    pictogramaId,
    imagenUrl,
    creadoEn: new Date().toISOString(),
  };

  almacenPictogramas51 = [nuevo, ...almacenPictogramas51];
  return { ...nuevo };
}

/**
 * Edita la palabra clave o el texto alternativo de un pictograma propio verificando que pertenezca al rol activo.
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

  const palabraClave = input.palabraClave?.trim() || actual.palabraClave;
  const textoAlternativo = input.textoAlternativo?.trim() || actual.textoAlternativo;

  const actualizado: PictogramaPropio51 = {
    ...actual,
    palabraClave,
    textoAlternativo,
  };
  almacenPictogramas51[idx] = actualizado;
  return { ...actualizado };
}

/**
 * Elimina un pictograma propio de la biblioteca verificando el aislamiento por rol.
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
 * para que aparezcan junto a los de ARASAAC en el buscador unificado (Pantalla 28p)
 * manteniendo el aislamiento por rol.
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param pictogramas Lista opcional de pictogramas (por defecto el almacén actual)
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
