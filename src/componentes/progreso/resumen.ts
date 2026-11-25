// Textos e indicadores de la pantalla 43 (HU-25) a partir del progreso que da Supabase.
// Todo es lógica sin pantalla, para poder probarla sola.
import { EMOCIONES } from "../ejecucion-tarea/emociones";
import { aISO, textoDiaCorto } from "./periodos";
import type { AmbitoTarea, AvisoProgreso, ProgresoAlumno, TareaProgreso } from "./tipos";

/** Tono del estado en la tabla: decide el color (siempre acompañado de icono y texto). */
export type TonoEstado = "exito" | "aviso" | "peligro" | "primario" | "neutro";

export interface EstadoVisible {
  texto: string;
  tono: TonoEstado;
  icono: "check" | "reloj" | "alerta" | "candado";
}

/** Las 5 emociones de la app y las que admite también la base de datos (valoracion_emocional). */
const ETIQUETAS_EMOCION: Record<string, string> = {
  ...Object.fromEntries(EMOCIONES.map((e) => [e.clave, e.etiqueta])),
  neutral: "Neutral",
  bien: "Bien",
  regular: "Regular",
  mal: "Mal",
};

const ETIQUETAS_NECESIDAD: Record<string, string> = {
  bano: "Baño",
  agua: "Agua",
  descanso: "Descanso",
  urgencia: "Urgencia",
  fin_de_tarea: "He terminado",
  ayuda: "Ayuda",
};

const conMayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ");

export function etiquetaEmocion(clave: string): string {
  return ETIQUETAS_EMOCION[clave] ?? conMayuscula(clave);
}

export function etiquetaNecesidad(clave: string): string {
  return ETIQUETAS_NECESIDAD[clave] ?? conMayuscula(clave);
}

export function etiquetaAmbito(ambito: AmbitoTarea): string {
  return ambito === "hogar" ? "Casa" : "Clase";
}

export function estadoVisible(tarea: TareaProgreso): EstadoVisible {
  switch (tarea.estado) {
    case "hecha":
      return { texto: "Hecha", tono: "exito", icono: "check" };
    case "en_curso":
      return { texto: "En curso", tono: "primario", icono: "reloj" };
    case "bloqueada":
      return { texto: "Bloqueada", tono: "peligro", icono: "candado" };
    default:
      return tarea.pendiente_motivo === "tiempo_agotado"
        ? { texto: "Sin terminar", tono: "aviso", icono: "alerta" }
        : { texto: "Pendiente", tono: "neutro", icono: "reloj" };
  }
}

/** Tareas sin hacer: pendientes, en curso y bloqueadas. */
export function tareasSinHacer(p: ProgresoAlumno): number {
  return p.resumen.total - p.resumen.hechas;
}

/** Detalle de las tareas sin hacer: «1 sin terminar · 1 en curso · 1 bloqueada» (cabe en una línea). */
export function detalleSinHacer(p: ProgresoAlumno): string {
  const r = p.resumen;
  const partes: string[] = [];
  if (r.sin_terminar) partes.push(`${r.sin_terminar} sin terminar`);
  if (r.en_curso) partes.push(`${r.en_curso} en curso`);
  if (r.bloqueadas)
    partes.push(`${r.bloqueadas} ${r.bloqueadas === 1 ? "bloqueada" : "bloqueadas"}`);
  return partes.join(" · ");
}

/** Porcentaje de tareas hechas (0 si no hay tareas). */
export function porcentajeHechas(hechas: number, total: number): number {
  return total > 0 ? Math.round((hechas / total) * 100) : 0;
}

/** La emoción que más ha marcado y en qué parte de las veces que marcó alguna. */
export function emocionMasFrecuente(
  p: ProgresoAlumno,
): { clave: string; etiqueta: string; porcentaje: number } | null {
  const primera = p.emociones[0];
  if (!primera) return null;
  const total = p.emociones.reduce((suma, e) => suma + e.total, 0);
  return {
    clave: primera.emocion,
    etiqueta: etiquetaEmocion(primera.emocion),
    porcentaje: porcentajeHechas(primera.total, total),
  };
}

const vecesTexto = (n: number) => (n === 1 ? "1 vez" : `${n} veces`);

function listaAvisos(avisos: readonly AvisoProgreso[]): string {
  return (
    avisos
      // creado_en viene en UTC: el día se cuenta en la hora local de la tableta.
      .map(
        (a) => `${etiquetaNecesidad(a.necesidad)} (${textoDiaCorto(aISO(new Date(a.creado_en)))})`,
      )
      .join(", ")
  );
}

/**
 * Frases del cuadro «Resumen del periodo»: Plan B activados, peticiones de ayuda y urgencias sin
 * atender. Si no ha pasado nada de eso, una sola frase que lo dice.
 */
export function frasesResumen(p: ProgresoAlumno, maxDetalle = 3): string[] {
  const frases: string[] = [];
  const conPlanB = p.tareas.filter((t) => t.plan_b);
  if (conPlanB.length) {
    const lista = conPlanB
      .slice(0, maxDetalle)
      .map((t) => `${t.titulo} (${textoDiaCorto(t.fecha)})`)
      .join(", ");
    const resto = conPlanB.length > maxDetalle ? ` y ${conPlanB.length - maxDetalle} más` : "";
    frases.push(`Plan B activado ${vecesTexto(conPlanB.length)}: ${lista}${resto}.`);
  }
  if (p.avisos.length) {
    const resto = p.avisos.length > maxDetalle ? ` y ${p.avisos.length - maxDetalle} más` : "";
    frases.push(
      `Ha pedido ayuda ${vecesTexto(p.avisos.length)}: ${listaAvisos(p.avisos.slice(0, maxDetalle))}${resto}.`,
    );
    const sinAtender = p.avisos.filter((a) => a.urgencia && !a.atendido).length;
    if (sinAtender)
      frases.push(
        sinAtender === 1
          ? "Hay 1 urgencia sin marcar como atendida."
          : `Hay ${sinAtender} urgencias sin marcar como atendidas.`,
      );
  }
  if (!frases.length) frases.push("Sin Plan B ni peticiones de ayuda en este periodo.");
  return frases;
}

/** Reparte una lista en páginas de `porPagina` elementos (al menos uno por página). */
export function paginar<T>(lista: readonly T[], porPagina: number, pagina: number) {
  const tam = Math.max(1, Math.floor(porPagina));
  const paginas = Math.max(1, Math.ceil(lista.length / tam));
  const actual = Math.min(Math.max(0, pagina), paginas - 1);
  return { elementos: lista.slice(actual * tam, actual * tam + tam), pagina: actual, paginas };
}
