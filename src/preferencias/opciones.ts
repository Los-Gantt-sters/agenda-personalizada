// Opciones de apariencia que el tutor puede elegir para cada estudiante (T-04.3, HU-04 y SCRUM-240).
// Los valores salen de BOCETOS_NUEVOS/definitiva_v2 (16.html, 16b.html, 17.html, 18.html, 19.html,
// 22.html, 24.html, 25.html y 26.html).
import type { ClaveNecesidadBasica } from "../necesidades/tipos";
import { NombreTema, TEMA_POR_DEFECTO, esNombreTema } from "../temas";

// ---- Tipo de letra (RF3.2): las tres fuentes pensadas para Lectura Fácil ----
export type FuenteLetra = "atkinson" | "lexend" | "andika";

export interface InfoFuente {
  etiqueta: string;
  /** Etiqueta del boceto 19.html */
  etiquetaBoceto: string;
  /** Nombre con el que se registra la fuente normal al cargarla (ver fuentes.ts). */
  familiaNormal: string;
  /** Nombre con el que se registra la fuente en negrita. */
  familiaNegrita: string;
}

export const FUENTES: Record<FuenteLetra, InfoFuente> = {
  atkinson: {
    etiqueta: "Atkinson Hyperlegible",
    etiquetaBoceto: "Atkinson Hyperlegible",
    familiaNormal: "AtkinsonHyperlegible_400Regular",
    familiaNegrita: "AtkinsonHyperlegible_700Bold",
  },
  lexend: {
    etiqueta: "Lexend",
    etiquetaBoceto: "Lexend",
    familiaNormal: "Lexend_400Regular",
    familiaNegrita: "Lexend_700Bold",
  },
  andika: {
    etiqueta: "Andika",
    etiquetaBoceto: "Escolar (Andika)",
    familiaNormal: "Andika_400Regular",
    familiaNegrita: "Andika_700Bold",
  },
};

// ---- Tamaño de letra (RF3.3) ----
export type TamanoLetra = "normal" | "grande" | "extra";

export const TAMANOS_LETRA: Record<TamanoLetra, { etiqueta: string; escala: number }> = {
  normal: { etiqueta: "Normal", escala: 1 },
  grande: { etiqueta: "Grande", escala: 1.15 },
  extra: { etiqueta: "Extra grande", escala: 1.3 },
};

// ---- Tamaño de los botones (RF3.4: tres opciones en 22.html) ----
export type TamanoBoton = "M" | "L" | "XL";

export const TAMANOS_BOTON: Record<
  TamanoBoton,
  { etiqueta: string; etiquetaBoceto: string; escala: number }
> = {
  M: { etiqueta: "Mediano", etiquetaBoceto: "Normal", escala: 1 },
  L: { etiqueta: "Grande", etiquetaBoceto: "Grande", escala: 1.15 },
  XL: { etiqueta: "Extra grande", etiquetaBoceto: "Gigante", escala: 1.32 },
};

// ---- Forma de los botones (RF3.5) ----
export type FormaBoton = "round" | "square" | "pill";

export const FORMAS_BOTON: Record<
  FormaBoton,
  { etiqueta: string; radioTarjeta: number; radioBoton: number }
> = {
  round: { etiqueta: "Redondeados", radioTarjeta: 20, radioBoton: 16 },
  square: { etiqueta: "Cuadrados", radioTarjeta: 4, radioBoton: 4 },
  pill: { etiqueta: "Circulares", radioTarjeta: 32, radioBoton: 999 },
};

// ---- Canal cognitivo de presentación (RF3.1, RI3.1, RNF4.4) ----
export type ModoCanal = "ambos" | "soloPictograma" | "soloTexto";

export interface InfoModoCanal {
  clave: ModoCanal;
  etiqueta: string;
  descripcion: string;
  icono: string;
}

export const MODOS_CANAL: Record<ModoCanal, InfoModoCanal> = {
  ambos: {
    clave: "ambos",
    etiqueta: "Dibujo y texto",
    descripcion: "Muestra el pictograma junto al texto en Lectura Fácil",
    icono: "🖼️🔤",
  },
  soloPictograma: {
    clave: "soloPictograma",
    etiqueta: "Solo pictograma",
    descripcion: "Solo muestra dibujos gigantes (sin texto para no lectores)",
    icono: "🖼️",
  },
  soloTexto: {
    clave: "soloTexto",
    etiqueta: "Solo texto",
    descripcion: "Solo muestra texto en letra grande (evita sobreestimulación)",
    icono: "🔤",
  },
};

// ---- Formato visual por defecto y locución de audio en Pantalla 17 (17.html) ----
export type FormatoVisualTarea17 =
  "pictograma" | "soloPictograma" | "textoFacil" | "fotoReal" | "video";

export const FORMATOS_VISUALES_17: Record<
  FormatoVisualTarea17,
  { etiqueta: string; resumenMenu: string; canalAsociado: ModoCanal }
> = {
  pictograma: {
    etiqueta: "Pictograma",
    resumenMenu: "Picto con etiqueta",
    canalAsociado: "ambos",
  },
  soloPictograma: {
    etiqueta: "Solo pictograma",
    resumenMenu: "Solo pictograma",
    canalAsociado: "soloPictograma",
  },
  textoFacil: {
    etiqueta: "Texto fácil",
    resumenMenu: "Texto fácil",
    canalAsociado: "soloTexto",
  },
  fotoReal: {
    etiqueta: "Foto real",
    resumenMenu: "Foto real",
    canalAsociado: "ambos",
  },
  video: {
    etiqueta: "Vídeo",
    resumenMenu: "Vídeo",
    canalAsociado: "ambos",
  },
};

export type LocucionAudio17 = "automatica" | "manual";

export const LOCUCIONES_AUDIO_17: Record<LocucionAudio17, { etiqueta: string }> = {
  automatica: { etiqueta: "Automática al abrir" },
  manual: { etiqueta: "Solo al tocar Audio" },
};

// ---- Letra escolar: cada centro enseña a leer en MAYÚSCULAS o en minúsculas ----
export type CajaLetra = "normal" | "mayusculas";

export const CAJAS_LETRA: Record<
  CajaLetra,
  { etiqueta: string; etiquetaBoceto: string; resumenMenu: string; descripcion: string }
> = {
  normal: {
    etiqueta: "Minúsculas",
    etiquetaBoceto: "Minúsculas (Aa)",
    resumenMenu: "Minús.",
    descripcion: "El texto se escribe como siempre",
  },
  mayusculas: {
    etiqueta: "MAYÚSCULAS",
    etiquetaBoceto: "MAYÚSCULAS (AA)",
    resumenMenu: "MAYÚS.",
    descripcion: "Todo el texto en letra mayúscula",
  },
};

// ---- Tareas que se ven en «Hecho» y en «Después» (24.html: stepper + y − de 1 a 5 y «Todas») ----
export type TareasVisibles = "una" | "dos" | "tres" | "cuatro" | "cinco" | "todas";

export const TAREAS_VISIBLES: Record<
  TareasVisibles,
  { etiqueta: string; etiquetaStepper: string; resumenMenu: string; maximo: number }
> = {
  una: { etiqueta: "Solo 1", etiquetaStepper: "1 tarea", resumenMenu: "Hasta 1", maximo: 1 },
  dos: { etiqueta: "Hasta 2", etiquetaStepper: "2 tareas", resumenMenu: "Hasta 2", maximo: 2 },
  tres: { etiqueta: "Hasta 3", etiquetaStepper: "3 tareas", resumenMenu: "Hasta 3", maximo: 3 },
  cuatro: { etiqueta: "Hasta 4", etiquetaStepper: "4 tareas", resumenMenu: "Hasta 4", maximo: 4 },
  cinco: { etiqueta: "Hasta 5", etiquetaStepper: "5 tareas", resumenMenu: "Hasta 5", maximo: 5 },
  todas: { etiqueta: "Todas", etiquetaStepper: "Todas", resumenMenu: "Todas", maximo: 99 },
};

export type DestinoLoginAgenda24 = "hoy" | "semana";

export const DESTINOS_LOGIN_AGENDA_24: Record<
  DestinoLoginAgenda24,
  { etiqueta: string; resumenMenu: string }
> = {
  hoy: {
    etiqueta: "Ir directo a tareas de Hoy (06 · baja carga)",
    resumenMenu: "Solo día",
  },
  semana: {
    etiqueta: "Ir a Semana completa (06b · visión global)",
    resumenMenu: "Día y semana",
  },
};

// ---- Reloj dentro de la tarea y aviso previo 5m (25.html) ----
export type VerReloj = "si" | "no";

export const VER_RELOJ: Record<
  VerReloj,
  { etiqueta: string; etiquetaBoceto: string; descripcion: string }
> = {
  si: {
    etiqueta: "Con reloj",
    etiquetaBoceto: "Con reloj arriba",
    descripcion: "Un reloj pequeño enseña cuánto tiempo queda",
  },
  no: {
    etiqueta: "Sin reloj",
    etiquetaBoceto: "Sin reloj (sin agobio)",
    descripcion: "La tarea se ve sin reloj",
  },
};

export type AvisoPrevio25 = "si" | "no";

export const AVISO_PREVIO_25: Record<AvisoPrevio25, { etiqueta: string; resumenMenu: string }> = {
  si: { etiqueta: "Avisar 5 min antes (08b)", resumenMenu: "Aviso 5m" },
  no: { etiqueta: "Sin aviso previo", resumenMenu: "Sin aviso" },
};

// ---- Necesidades que salen en «Ayuda» (26.html: catálogo de 8 pictogramas, máximo 3) ----
export const NECESIDADES_AYUDA: Record<ClaveNecesidadBasica, { etiqueta: string }> = {
  bano: { etiqueta: "Baño" },
  agua: { etiqueta: "Agua" },
  descanso: { etiqueta: "Descanso" },
};

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

/** Orden en que se muestran las opciones en el panel. */
export const ORDEN_FUENTES: FuenteLetra[] = ["andika", "lexend", "atkinson"];
export const ORDEN_TAMANOS_LETRA: TamanoLetra[] = ["normal", "grande", "extra"];
export const ORDEN_TAMANOS_BOTON: TamanoBoton[] = ["M", "L", "XL"];
export const ORDEN_FORMAS: FormaBoton[] = ["round", "square", "pill"];
export const ORDEN_MODOS_CANAL: ModoCanal[] = ["ambos", "soloPictograma", "soloTexto"];
export const ORDEN_CAJAS_LETRA: CajaLetra[] = ["normal", "mayusculas"];
export const ORDEN_TAREAS_VISIBLES: TareasVisibles[] = [
  "una",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "todas",
];
export const ORDEN_VER_RELOJ: VerReloj[] = ["si", "no"];
export const ORDEN_NECESIDADES_AYUDA: ClaveNecesidadBasica[] = ["bano", "agua", "descanso"];

/** RI3.1: preferencias de visualización del estudiante que cubre este panel. */
export interface PreferenciasApariencia {
  tema: NombreTema;
  fuente: FuenteLetra;
  tamanoLetra: TamanoLetra;
  tamanoBoton: TamanoBoton;
  forma: FormaBoton;
  canal: ModoCanal;
  /** Letra escolar: como se escribe o todo en mayúsculas. */
  caja: CajaLetra;
  /** Cuántas tareas se ven a cada lado de «Ahora». */
  tareasVisibles: TareasVisibles;
  /** Si se ve el reloj mientras se hace una tarea. */
  reloj: VerReloj;
  /** Necesidades que salen en «Ayuda» (al menos una; «Urgencia» sale siempre). */
  necesidades: ClaveNecesidadBasica[];
}

/**
 * Valores por defecto: tema claro («Piedra»), Lexend, redondeados, botones grandes, ambos, el texto
 * como se escribe y hasta 3 tareas a cada lado.
 */
export const PREFERENCIAS_POR_DEFECTO: PreferenciasApariencia = {
  tema: TEMA_POR_DEFECTO,
  fuente: "lexend",
  tamanoLetra: "normal",
  tamanoBoton: "L",
  forma: "round",
  canal: "ambos",
  caja: "normal",
  tareasVisibles: "tres",
  reloj: "si",
  necesidades: ["bano", "agua", "descanso"],
};

const tiene = (objeto: object, clave: unknown): boolean =>
  typeof clave === "string" && Object.prototype.hasOwnProperty.call(objeto, clave);

/**
 * Convierte datos de origen dudoso (p. ej. el perfil guardado en la base de datos) en preferencias
 * válidas: lo que falte o no exista se sustituye por el valor por defecto.
 */
export function normalizarPreferencias(crudo: unknown): PreferenciasApariencia {
  const d = PREFERENCIAS_POR_DEFECTO;
  if (typeof crudo !== "object" || crudo === null) return { ...d };
  const c = crudo as Record<string, unknown>;
  return {
    tema: esNombreTema(c.tema) ? c.tema : d.tema,
    fuente: tiene(FUENTES, c.fuente) ? (c.fuente as FuenteLetra) : d.fuente,
    tamanoLetra: tiene(TAMANOS_LETRA, c.tamanoLetra)
      ? (c.tamanoLetra as TamanoLetra)
      : d.tamanoLetra,
    tamanoBoton: tiene(TAMANOS_BOTON, c.tamanoBoton)
      ? (c.tamanoBoton as TamanoBoton)
      : d.tamanoBoton,
    forma: tiene(FORMAS_BOTON, c.forma) ? (c.forma as FormaBoton) : d.forma,
    canal: tiene(MODOS_CANAL, c.canal) ? (c.canal as ModoCanal) : d.canal,
    caja: tiene(CAJAS_LETRA, c.caja) ? (c.caja as CajaLetra) : d.caja,
    tareasVisibles: tiene(TAREAS_VISIBLES, c.tareasVisibles)
      ? (c.tareasVisibles as TareasVisibles)
      : d.tareasVisibles,
    reloj: tiene(VER_RELOJ, c.reloj) ? (c.reloj as VerReloj) : d.reloj,
    necesidades: normalizarNecesidades(c.necesidades),
  };
}

/** Necesidades válidas, sin repetir y en el orden de siempre; si no queda ninguna, todas. */
function normalizarNecesidades(crudo: unknown): ClaveNecesidadBasica[] {
  const lista = Array.isArray(crudo) ? crudo : [];
  const validas = ORDEN_NECESIDADES_AYUDA.filter((n) => lista.includes(n));
  return validas.length > 0 ? validas : [...PREFERENCIAS_POR_DEFECTO.necesidades];
}
