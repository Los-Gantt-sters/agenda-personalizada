// Los 5 formatos de un paso (SCRUM-95 · T-10.2, HU-10, pantallas 07 a 07d y 07f).
// Cambios 17-11: debajo de la imagen van 5 botones con su pictograma y su etiqueta (Pictograma,
// Texto, Foto, Vídeo y Audio); solo salen los que el profesor deja elegir, y se empieza por el que
// diga Preferencias. El audio suena sin quitar la imagen.
import type { FormatoPaso, PasoTarea, Tarea } from "../agenda/tipos";
import type { ModoCanal } from "../../preferencias/opciones";

export interface InfoFormato {
  clave: FormatoPaso;
  etiqueta: string;
  /** Pictograma ARASAAC del botón: dibuja lo que hace la opción. */
  pictogramaId: number;
}

export const FORMATOS_PASO: readonly InfoFormato[] = [
  // «dibujo», «texto», «foto», «cámara de vídeo» y «altavoz» en ARASAAC.
  { clave: "pictograma", etiqueta: "Pictograma", pictogramaId: 32518 },
  { clave: "texto", etiqueta: "Texto", pictogramaId: 37340 },
  { clave: "foto", etiqueta: "Foto", pictogramaId: 7107 },
  { clave: "video", etiqueta: "Vídeo", pictogramaId: 25524 },
  { clave: "audio", etiqueta: "Audio", pictogramaId: 26628 },
];

const TODOS: FormatoPaso[] = FORMATOS_PASO.map((f) => f.clave);

/** Formatos que el profesor deja elegir en esta tarea (si no dice nada, los 5). */
export function formatosPermitidos(tarea: Pick<Tarea, "formatos_permitidos">): FormatoPaso[] {
  const lista = (tarea.formatos_permitidos ?? []).filter((f) => TODOS.includes(f));
  return lista.length > 0 ? TODOS.filter((f) => lista.includes(f)) : TODOS;
}

/**
 * Formato con el que se abre el paso: el de Preferencias («Solo texto» → Texto; si no, Pictograma),
 * si el profesor lo permite; si no, el primero permitido. El audio nunca es el de inicio: suena al
 * pulsarlo.
 */
export function formatoInicial(canal: ModoCanal, permitidos: FormatoPaso[]): FormatoPaso {
  const preferido: FormatoPaso = canal === "soloTexto" ? "texto" : "pictograma";
  if (permitidos.includes(preferido)) return preferido;
  return permitidos.find((f) => f !== "audio") ?? "pictograma";
}

/** Título corto del paso (los pasos antiguos solo tenían texto). */
export function tituloDe(paso: PasoTarea): string {
  return (paso.titulo ?? "").trim() || paso.texto;
}

/** Pasos en orden. */
export function pasosOrdenados(tarea: Pick<Tarea, "pasos">): PasoTarea[] {
  return (tarea.pasos ?? []).slice().sort((a, b) => a.orden - b.orden);
}

/** Si el paso tiene lo que hace falta para enseñar ese formato. */
export function pasoTiene(paso: PasoTarea, formato: FormatoPaso): boolean {
  switch (formato) {
    case "foto":
      return Boolean(paso.foto?.url);
    case "video":
      return Boolean(paso.video?.url);
    // Pictograma: si no hay, sale el dibujo de la tarea. Texto y audio (voz) siempre se pueden.
    default:
      return true;
  }
}

/** Lo que se lee en voz alta para un paso si no tiene audio grabado. */
export function textoVozPaso(paso: PasoTarea, numero: number): string {
  const titulo = tituloDe(paso);
  const texto = paso.texto.trim();
  return texto && texto !== titulo
    ? `Paso ${numero}. ${titulo}. ${texto}`
    : `Paso ${numero}. ${titulo}`;
}

/** «Picto · Texto · Foto · Vídeo · Audio»: qué formatos tiene ya un paso (lista del editor 28s). */
export function formatosDelPaso(paso: PasoTarea): Record<FormatoPaso, boolean> {
  return {
    pictograma: Boolean(paso.pictograma_url),
    texto: Boolean(paso.texto.trim()) && paso.texto.trim() !== tituloDe(paso),
    foto: Boolean(paso.foto?.url || paso.foto?.ruta),
    video: Boolean(paso.video?.url || paso.video?.ruta),
    audio: Boolean(paso.audio?.url || paso.audio?.ruta),
  };
}
