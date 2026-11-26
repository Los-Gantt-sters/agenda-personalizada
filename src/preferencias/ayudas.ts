// Ayudas de la pantalla «¿Qué necesitas?» (14) que el adulto elige en la 26 (MOD HU-18, SCRUM-238).
// Cada ayuda se guarda completa (AyudaElegida) para que la 14 la pinte sin pedir nada a la red.
// El catálogo de 8 sugerencias es el de la 26 de Álvaro (SCRUM-240); sus códigos antiguos
// («bano», «agua»...) se convierten al normalizar para no perder lo que ya estaba elegido.
import type { PictogramaArasaac } from "../arasaac/tipos";
import { urlImagenPictograma } from "../arasaac/urls";
import type { AyudaElegida, ClaveNecesidadBasica } from "../necesidades/tipos";
import type { PictogramaPropio51 } from "../tipos/bibliotecaPictogramas";

/** Máximo de ayudas que ve el alumno en la 14 («Urgencia» va aparte, siempre). */
export const MAXIMO_AYUDAS = 3;

export interface PictogramaAyudaCatalogo26 {
  id: string;
  etiqueta: string;
  origen: "ARASAAC" | "Mi biblioteca";
  emoji: string;
  pictoIdArasaac: number;
  claveBasica?: ClaveNecesidadBasica;
}

export const CATALOGO_AYUDAS_26: PictogramaAyudaCatalogo26[] = [
  {
    id: "bano",
    etiqueta: "Ir al baño",
    origen: "ARASAAC",
    emoji: "🚻",
    pictoIdArasaac: 6929,
    claveBasica: "bano",
  },
  {
    id: "agua",
    etiqueta: "Beber agua",
    origen: "ARASAAC",
    emoji: "💧",
    pictoIdArasaac: 2248,
    claveBasica: "agua",
  },
  {
    id: "descanso",
    etiqueta: "Descansar (propio)",
    origen: "Mi biblioteca",
    emoji: "🛋️",
    pictoIdArasaac: 2369,
    claveBasica: "descanso",
  },
  {
    id: "desayuno",
    etiqueta: "Tengo hambre",
    origen: "ARASAAC",
    emoji: "🥪",
    pictoIdArasaac: 4626,
  },
  {
    id: "casa",
    etiqueta: "Ir a casa",
    origen: "ARASAAC",
    emoji: "🏠",
    pictoIdArasaac: 6964,
  },
  {
    id: "libro",
    etiqueta: "Rincón lectura",
    origen: "Mi biblioteca",
    emoji: "📖",
    pictoIdArasaac: 2450,
  },
  {
    id: "futbol",
    etiqueta: "Jugar patio",
    origen: "ARASAAC",
    emoji: "⚽",
    pictoIdArasaac: 7137,
  },
  {
    id: "ayuda",
    etiqueta: "Pedir ayuda",
    origen: "ARASAAC",
    emoji: "✋",
    pictoIdArasaac: 32648,
  },
];

/** Ayuda guardable a partir de una sugerencia del catálogo de la 26. */
export function ayudaDesdeCatalogo26(item: PictogramaAyudaCatalogo26): AyudaElegida {
  const deArasaac = item.origen === "ARASAAC";
  return {
    id: deArasaac ? `arasaac:${item.pictoIdArasaac}` : `propio:${item.id}`,
    texto: item.etiqueta,
    imagenUrl: urlImagenPictograma(item.pictoIdArasaac),
    origen: deArasaac ? "arasaac" : "biblioteca",
  };
}

/** Ayuda guardable a partir de un resultado del buscador de ARASAAC. */
export function ayudaDesdeArasaac(p: PictogramaArasaac): AyudaElegida {
  return {
    id: `arasaac:${p.id}`,
    texto: p.palabraClave,
    imagenUrl: p.urlImagen,
    origen: "arasaac",
  };
}

/** Ayuda guardable a partir de un pictograma propio de Mi biblioteca (pantalla 51). */
export function ayudaDesdeBiblioteca(p: PictogramaPropio51): AyudaElegida {
  return {
    id: `propio:${p.id}`,
    texto: p.palabraClave,
    imagenUrl: p.imagenUrl,
    origen: "biblioteca",
  };
}

const AYUDAS_DEL_CATALOGO = CATALOGO_AYUDAS_26.map((item) => ({
  ayuda: ayudaDesdeCatalogo26(item),
  item,
}));

function ayudaDeClaveBasica(clave: ClaveNecesidadBasica): AyudaElegida | undefined {
  return AYUDAS_DEL_CATALOGO.find(({ item }) => item.claveBasica === clave)?.ayuda;
}

/** Baño, agua y descanso: lo que sale si no hay nada elegido. */
export const AYUDAS_POR_DEFECTO: readonly AyudaElegida[] = (
  ["bano", "agua", "descanso"] as const
).map((clave) => ayudaDeClaveBasica(clave)!);

function esAyudaValida(valor: unknown): valor is AyudaElegida {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  const textoNoVacio = (x: unknown) => typeof x === "string" && x.trim().length > 0;
  return (
    textoNoVacio(v.id) &&
    textoNoVacio(v.texto) &&
    textoNoVacio(v.imagenUrl) &&
    (v.origen === "arasaac" || v.origen === "biblioteca")
  );
}

/**
 * Convierte lo guardado (de origen dudoso) en una lista válida de ayudas: objetos completos o
 * códigos antiguos del catálogo, sin repetir y como mucho 3. Si no queda ninguna, las del
 * `respaldo` (necesidades básicas de antes) y, si tampoco, las de por defecto.
 */
export function normalizarAyudas(
  crudo: unknown,
  respaldo: readonly ClaveNecesidadBasica[],
): AyudaElegida[] {
  const lista = Array.isArray(crudo) ? crudo : [];
  const ayudas: AyudaElegida[] = [];
  for (const elemento of lista) {
    if (ayudas.length >= MAXIMO_AYUDAS) break;
    const ayuda =
      typeof elemento === "string"
        ? AYUDAS_DEL_CATALOGO.find(({ item }) => item.id === elemento)?.ayuda
        : esAyudaValida(elemento)
          ? {
              id: elemento.id,
              texto: elemento.texto,
              imagenUrl: elemento.imagenUrl,
              origen: elemento.origen,
            }
          : undefined;
    if (ayuda && !ayudas.some((a) => a.id === ayuda.id)) ayudas.push({ ...ayuda });
  }
  if (ayudas.length > 0) return ayudas;

  const desdeRespaldo = respaldo
    .map(ayudaDeClaveBasica)
    .filter((a): a is AyudaElegida => a !== undefined)
    .slice(0, MAXIMO_AYUDAS);
  return (desdeRespaldo.length > 0 ? desdeRespaldo : AYUDAS_POR_DEFECTO).map((a) => ({ ...a }));
}

/** Baño, agua o descanso si la ayuda es una de esas sugerencias del catálogo; si no, null. */
export function claveBasicaDeAyuda(ayuda: AyudaElegida): ClaveNecesidadBasica | null {
  return AYUDAS_DEL_CATALOGO.find((c) => c.ayuda.id === ayuda.id)?.item.claveBasica ?? null;
}

/**
 * Necesidades básicas que corresponden a las ayudas elegidas, en su orden. Si ninguna es básica,
 * se conservan las `anteriores` (las necesidades nunca se quedan vacías).
 */
export function necesidadesDesdeAyudas(
  ayudas: readonly AyudaElegida[],
  anteriores: readonly ClaveNecesidadBasica[],
): ClaveNecesidadBasica[] {
  const basicas = ayudas
    .map(claveBasicaDeAyuda)
    .filter((c): c is ClaveNecesidadBasica => c !== null);
  return basicas.length > 0 ? basicas : [...anteriores];
}
