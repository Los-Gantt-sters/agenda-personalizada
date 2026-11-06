// Catálogo de pictogramas de ARASAAC que la app usa con frecuencia (RI16.1) y correspondencia
// directa con la biblioteca LIB y categorías CATS de tuagendita-prototipos.html.
// Funciona sin conexión: los identificadores están fijados y comprobados contra la API pública
// de ARASAAC, y las imágenes se cargan desde static.arasaac.org.
import { normalizarTexto } from "./texto";
import { CategoriaPictogramas, PictogramaArasaac, RecursoBibliotecaArasaac } from "./tipos";
import { urlImagenPictograma } from "./urls";

function entrada(
  id: number,
  palabraClave: string,
  simbolo: string,
  ...sinonimos: string[]
): PictogramaArasaac {
  return {
    id,
    palabraClave,
    palabrasClave: [palabraClave, ...sinonimos],
    urlImagen: urlImagenPictograma(id),
    descripcion: `Pictograma de ${palabraClave}`,
    categorias: [],
    simbolo,
  };
}

/**
 * Catálogo base de pictogramas oficiales de ARASAAC (RI16.1).
 * Cubre las 42 entradas de LIB en tuagendita-prototipos.html, las 3 necesidades fisiológicas
 * básicas (HU-18) y las acciones/categorías principales de la agenda.
 */
export const CATALOGO_PICTOGRAMAS: readonly PictogramaArasaac[] = [
  // Necesidades fisiológicas básicas (HU-18: baño, agua y descanso — prototipos 14 y 15)
  entrada(6929, "baño", "🚻", "cuarto de baño", "aseo"),
  entrada(2248, "agua", "💧", "beber agua"),
  entrada(3299, "descansar", "🛋️", "reposar", "descanso"),

  // Acciones nucleares de la agenda (HU-06, HU-08 — prototipos 06 a 12)
  entrada(5431, "empezar", "▶️", "comenzar", "iniciar"),
  entrada(5358, "terminar", "⏹️", "fin", "acabar", "finalizar"),
  entrada(12252, "ayuda", "✋", "apoyo", "colaboración"),
  entrada(2439, "jugar", "🎲", "juego"),
  entrada(2381, "escuchar", "🔊", "oír"),
  entrada(6964, "casa", "🏠", "hogar"),

  // Biblioteca LIB de tuagendita-prototipos.html (42 pictogramas de tareas escolares y del hogar)
  entrada(2475, "mochila", "🎒", "preparar la mochila"),
  entrada(27574, "asamblea", "👥", "grupo", "reunión"),
  entrada(9876, "fotocopia", "🖨️", "reprografía", "fotocopiadora"),
  entrada(2349, "comer", "🍽️", "comedor", "tomar"),
  entrada(5513, "menú", "📋", "lista"),
  entrada(4772, "visita", "🧭", "guía"),
  entrada(7137, "fútbol", "⚽", "recreo", "deporte"),
  entrada(28207, "almuerzo", "🍎", "fruta"),
  entrada(2974, "huerto", "🌱", "planta"),
  entrada(7794, "manualidades", "✂️", "ir al taller"),
  entrada(8975, "lavar las manos", "🧼", "lavarse las manos", "manos"),
  entrada(2262, "autobús", "🚌", "colectivo", "micro", "coger el autobús"),
  entrada(4695, "merienda", "🥪", "bocadillo"),
  entrada(2494, "pan", "🍞"),
  entrada(2541, "queso", "🧀"),
  entrada(11463, "zumo", "🧃"),
  entrada(2872, "ordenar", "🧹", "barrer"),
  entrada(2450, "libro", "📚", "libros", "deberes", "hacer los deberes"),
  entrada(8575, "estuche", "✏️", "lápiz"),
  entrada(3351, "limpiar", "🧽", "bayeta"),
  entrada(2414, "grifo", "🚰", "grifo agua"),
  entrada(2964, "jabón", "🧴"),
  entrada(8251, "frotar", "👐", "frotar manos"),
  entrada(21345, "aclarar", "💦", "aclarar con agua"),
  entrada(2566, "secar", "🧻", "toalla", "secar toalla"),
  entrada(2304, "cama", "🛏️", "hacer la cama"),
  entrada(2737, "dientes", "🦷", "dentista", "ir al dentista"),
  entrada(2370, "ducha", "🚿", "ducharme"),
  entrada(8163, "medicina", "💊", "medicinas", "tomar la medicina"),
  entrada(28609, "pádel", "🎾", "jugar al pádel"),
  entrada(3142, "piscina", "🏊", "ir a la piscina"),
  entrada(8649, "pasear", "🚶", "paseo", "dar un paseo"),
  entrada(3087, "cumpleaños", "🎂", "ir a un cumpleaños"),
  entrada(10171, "llamar", "📞", "teléfono", "llamar teléfono", "llamar a un amigo"),
  entrada(2442, "lavadora", "🧺", "ropa", "poner la lavadora"),
  entrada(2342, "cocinar", "🍳"),
  entrada(2369, "dormir", "😴", "siesta", "dormir la siesta"),
  entrada(4602, "cine", "🎬", "ir al cine"),
  entrada(2296, "café", "☕", "quedar café", "quedar con amigos"),
  entrada(6225, "taller", "🧶", "taller ocupacional"),
  entrada(2619, "zanahoria", "🥕", "verdura"),
  entrada(3082, "colegio", "🏫", "clase", "escuela"),

  // Categorías adicionales del asistente guiado del estudiante (prototipos 19 y 20)
  entrada(25790, "amigos", "🧑‍🤝‍🧑", "amigo", "amistad"),
  entrada(14264, "salud", "🩺", "médico"),
];

/** Pictograma del catálogo por su palabra clave principal (sin importar tildes ni mayúsculas). */
export function pictogramaDelCatalogo(palabraClave: string): PictogramaArasaac | undefined {
  const buscada = normalizarTexto(palabraClave);
  return CATALOGO_PICTOGRAMAS.find((p) => normalizarTexto(p.palabraClave) === buscada);
}

/** Pictograma del catálogo por su identificador numérico de ARASAAC. */
export function pictogramaPorId(id: number): PictogramaArasaac | undefined {
  return CATALOGO_PICTOGRAMAS.find((p) => p.id === id);
}

/** Pictograma del catálogo por el símbolo emoji usado en tuagendita-prototipos.html. */
export function pictogramaPorSimbolo(simbolo: string): PictogramaArasaac | undefined {
  const limpio = simbolo.trim();
  return CATALOGO_PICTOGRAMAS.find((p) => p.simbolo === limpio);
}

/** Busca en el catálogo por cualquier palabra clave que contenga el texto. Sin conexión. */
export function buscarEnCatalogo(termino: string): PictogramaArasaac[] {
  const buscada = normalizarTexto(termino);
  if (!buscada) return [];
  return CATALOGO_PICTOGRAMAS.filter((p) =>
    p.palabrasClave.some((k) => normalizarTexto(k).includes(buscada)),
  );
}

function exigirDelCatalogo(palabraClave: string): PictogramaArasaac {
  const encontrado = pictogramaDelCatalogo(palabraClave);
  if (!encontrado) {
    throw new Error(`Falta el pictograma "${palabraClave}" en CATALOGO_PICTOGRAMAS`);
  }
  return encontrado;
}

/**
 * Las 5 categorías guiadas y sus 20 actividades del prototipo (CATS en prototipos 19 y 20:
 * «¿Qué vas a hacer después del cole?» → «Elige el dibujo»), para crear tareas sin teclado (RF5.10).
 */
export const CATEGORIAS_ESTUDIANTE: readonly CategoriaPictogramas[] = [
  {
    nombre: "Deporte",
    pictograma: exigirDelCatalogo("fútbol"),
    actividades: [
      { titulo: "Jugar al pádel", pictograma: exigirDelCatalogo("pádel") },
      { titulo: "Jugar al fútbol", pictograma: exigirDelCatalogo("fútbol") },
      { titulo: "Ir a la piscina", pictograma: exigirDelCatalogo("piscina") },
      { titulo: "Dar un paseo", pictograma: exigirDelCatalogo("pasear") },
    ],
  },
  {
    nombre: "Casa",
    pictograma: exigirDelCatalogo("casa"),
    actividades: [
      { titulo: "Hacer la cama", pictograma: exigirDelCatalogo("cama") },
      { titulo: "Poner la lavadora", pictograma: exigirDelCatalogo("lavadora") },
      { titulo: "Cocinar", pictograma: exigirDelCatalogo("cocinar") },
      { titulo: "Barrer", pictograma: exigirDelCatalogo("ordenar") },
    ],
  },
  {
    nombre: "Amigos",
    pictograma: exigirDelCatalogo("amigos"),
    actividades: [
      { titulo: "Ir a un cumpleaños", pictograma: exigirDelCatalogo("cumpleaños") },
      { titulo: "Ir al cine", pictograma: exigirDelCatalogo("cine") },
      { titulo: "Llamar a un amigo", pictograma: exigirDelCatalogo("llamar") },
      { titulo: "Quedar con amigos", pictograma: exigirDelCatalogo("café") },
    ],
  },
  {
    nombre: "Salud",
    pictograma: exigirDelCatalogo("salud"),
    actividades: [
      { titulo: "Tomar la medicina", pictograma: exigirDelCatalogo("medicina") },
      { titulo: "Ir al dentista", pictograma: exigirDelCatalogo("dientes") },
      { titulo: "Ducharme", pictograma: exigirDelCatalogo("ducha") },
      { titulo: "Dormir la siesta", pictograma: exigirDelCatalogo("dormir") },
    ],
  },
  {
    nombre: "Clase",
    pictograma: exigirDelCatalogo("colegio"),
    actividades: [
      { titulo: "Preparar la mochila", pictograma: exigirDelCatalogo("mochila") },
      { titulo: "Hacer los deberes", pictograma: exigirDelCatalogo("libro") },
      { titulo: "Coger el autobús", pictograma: exigirDelCatalogo("autobús") },
      { titulo: "Ir al taller", pictograma: exigirDelCatalogo("manualidades") },
    ],
  },
];

/** Comprueba que un recurso de la biblioteca tiene descripción alternativa no vacía (RF14.7). */
export function tieneDescripcionValida(
  recurso: Pick<RecursoBibliotecaArasaac, "descripcionAlternativa">,
): boolean {
  return recurso.descripcionAlternativa.trim().length > 0;
}
