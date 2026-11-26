// Opciones de apariencia que el tutor puede elegir para cada estudiante (T-04.3, HU-04).
// Los valores salen de tuagendita-prototipos.html: FONTS, FS, BS, SHAPES y canales (canal / chan),
// con la variante A como valores por defecto.
import type { ClaveNecesidadBasica } from "../necesidades/tipos";
import { NombreTema, TEMA_POR_DEFECTO, esNombreTema } from "../temas";

// ---- Tipo de letra (RF3.2): las tres fuentes pensadas para Lectura Fácil del prototipo ----
export type FuenteLetra = "atkinson" | "lexend" | "andika";

export interface InfoFuente {
  etiqueta: string;
  /** Nombre con el que se registra la fuente normal al cargarla (ver fuentes.ts). */
  familiaNormal: string;
  /** Nombre con el que se registra la fuente en negrita. */
  familiaNegrita: string;
}

export const FUENTES: Record<FuenteLetra, InfoFuente> = {
  atkinson: {
    etiqueta: "Atkinson Hyperlegible",
    familiaNormal: "AtkinsonHyperlegible_400Regular",
    familiaNegrita: "AtkinsonHyperlegible_700Bold",
  },
  lexend: {
    etiqueta: "Lexend",
    familiaNormal: "Lexend_400Regular",
    familiaNegrita: "Lexend_700Bold",
  },
  andika: {
    etiqueta: "Andika",
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

// ---- Tamaño de los botones (RF3.4: al menos tres opciones) ----
export type TamanoBoton = "M" | "L" | "XL";

export const TAMANOS_BOTON: Record<TamanoBoton, { etiqueta: string; escala: number }> = {
  M: { etiqueta: "Mediano", escala: 1 },
  L: { etiqueta: "Grande", escala: 1.15 },
  XL: { etiqueta: "Extra grande", escala: 1.32 },
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
// Permite elegir si en cada pantalla se ven solo dibujos/pictogramas, solo texto o ambos.
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

// ---- Letra escolar: cada centro enseña a leer en MAYÚSCULAS o en minúsculas ----
// «Minúsculas» deja el texto como está escrito (no lo fuerza todo a minúscula).
export type CajaLetra = "normal" | "mayusculas";

export const CAJAS_LETRA: Record<CajaLetra, { etiqueta: string; descripcion: string }> = {
  normal: { etiqueta: "Minúsculas", descripcion: "El texto se escribe como siempre" },
  mayusculas: { etiqueta: "MAYÚSCULAS", descripcion: "Todo el texto en letra mayúscula" },
};

// ---- Tareas que se ven en «Hecho» y en «Después» (concepto de tiempo de cada alumno) ----
// Hay quien se orienta mejor con pocas tareas a la vista y quien quiere ver el día entero.
// SCRUM-251 (MOD HU-06, boceto 24): se elige con «−» y «+» de 1 a 5 y, después de 5, «Todas».
export type TareasVisibles = "una" | "dos" | "tres" | "cuatro" | "cinco" | "todas";

export const TAREAS_VISIBLES: Record<TareasVisibles, { etiqueta: string; maximo: number }> = {
  una: { etiqueta: "Solo 1", maximo: 1 },
  dos: { etiqueta: "Hasta 2", maximo: 2 },
  tres: { etiqueta: "Hasta 3", maximo: 3 },
  cuatro: { etiqueta: "Hasta 4", maximo: 4 },
  cinco: { etiqueta: "Hasta 5", maximo: 5 },
  // Sin límite: si no caben todas, las tarjetas se hacen más pequeñas y se cuentan las que faltan.
  todas: { etiqueta: "Todas", maximo: 99 },
};

// ---- Reloj dentro de la tarea: se ve o no (mejora de la profesora, noviembre de 2026) ----
// A unos alumnos el reloj les ayuda a saber cuánto queda y a otros les agobia. Si se ve, es pequeño.
export type VerReloj = "si" | "no";

export const VER_RELOJ: Record<VerReloj, { etiqueta: string; descripcion: string }> = {
  si: { etiqueta: "Con reloj", descripcion: "Un reloj pequeño enseña cuánto tiempo queda" },
  no: { etiqueta: "Sin reloj", descripcion: "La tarea se ve sin reloj" },
};

// ---- Pantalla al entrar: Hoy (06) o Semana completa (06b) (MOD HU-17, bocetos 24 y 26d) ----
// Según su nivel cognitivo, el alumno entra directo a las tareas de hoy (baja carga) o a la semana
// entera (visión global). Solo con «Semana» sale el botón «Ver semana» en la agenda del día.
export type VistaAgendaPref = "diaria" | "semanal";

export const VISTAS_AGENDA: Record<VistaAgendaPref, { etiqueta: string; descripcion: string }> = {
  diaria: {
    etiqueta: "Ir directo a Hoy",
    descripcion: "Entra a las tareas de hoy (06). Menos cosas a la vista.",
  },
  semanal: {
    etiqueta: "Semana completa",
    descripcion: "Entra a la semana de lunes a domingo (06b) y puede ir a cada día.",
  },
};

// ---- Necesidades que salen en «Ayuda» (mejora de la profesora, noviembre de 2026) ----
// Se elige cuáles salen (aún no se guarda por alumno); «Urgencia» sale siempre.
export const NECESIDADES_AYUDA: Record<ClaveNecesidadBasica, { etiqueta: string }> = {
  bano: { etiqueta: "Baño" },
  agua: { etiqueta: "Agua" },
  descanso: { etiqueta: "Descanso" },
};

/** Orden en que se muestran las opciones en el panel. */
export const ORDEN_FUENTES: FuenteLetra[] = ["atkinson", "lexend", "andika"];
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

/** Contador «−» / «+» de «Tareas que se ven»: el valor anterior o siguiente (se queda en los bordes). */
export function moverTareasVisibles(actual: TareasVisibles, delta: -1 | 1): TareasVisibles {
  const i = ORDEN_TAREAS_VISIBLES.indexOf(actual);
  const j = Math.min(ORDEN_TAREAS_VISIBLES.length - 1, Math.max(0, i + delta));
  return ORDEN_TAREAS_VISIBLES[j];
}
export const ORDEN_VER_RELOJ: VerReloj[] = ["si", "no"];
export const ORDEN_VISTAS_AGENDA: VistaAgendaPref[] = ["diaria", "semanal"];
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
  /** MOD HU-17: pantalla al entrar (Hoy o Semana) y si puede ver la semana. */
  vistaAgenda: VistaAgendaPref;
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
  vistaAgenda: "diaria",
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
    vistaAgenda: tiene(VISTAS_AGENDA, c.vistaAgenda)
      ? (c.vistaAgenda as VistaAgendaPref)
      : d.vistaAgenda,
    necesidades: normalizarNecesidades(c.necesidades),
  };
}

/** Necesidades válidas, sin repetir y en el orden de siempre; si no queda ninguna, todas. */
function normalizarNecesidades(crudo: unknown): ClaveNecesidadBasica[] {
  const lista = Array.isArray(crudo) ? crudo : [];
  const validas = ORDEN_NECESIDADES_AYUDA.filter((n) => lista.includes(n));
  return validas.length > 0 ? validas : [...PREFERENCIAS_POR_DEFECTO.necesidades];
}
