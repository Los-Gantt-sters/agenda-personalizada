// Textos e indicadores de la pantalla 43 (HU-25) a partir del progreso que da Supabase.
// Todo es lógica sin pantalla, para poder probarla sola.
import { EMOCIONES } from "../ejecucion-tarea/emociones";
import { aISO, textoDiaSinMes } from "./periodos";
import type { AmbitoTarea, ProgresoAlumno, TareaProgreso } from "./tipos";

/**
 * Tono del estado en la tabla: decide los colores de la etiqueta (siempre con su texto, nunca solo
 * color). «pendiente» es el amarillo de lo que está por hacer.
 */
export type TonoEstado = "exito" | "aviso" | "peligro" | "primario" | "pendiente";

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
        : { texto: "Pendiente", tono: "pendiente", icono: "reloj" };
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

/** «a», «a y b», «a, b y c». */
function unirConY(partes: readonly string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/** Nombra hasta `max` elementos y dice cuántos más hay. */
function algunos(partes: readonly string[], max: number): string {
  const resto = partes.length - max;
  return resto > 0 ? `${partes.slice(0, max).join(", ")} y ${resto} más` : unirConY(partes);
}

const horaLocal = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Tono de una tarjeta del resumen: decide sus colores. */
export type TonoTarjeta = "exito" | "neutro" | "primario" | "aviso" | "peligro";

export interface TarjetaResumen {
  id: "dias" | "plan-b" | "ayuda" | "sin-terminar" | "urgencias";
  tono: TonoTarjeta;
  /** Lo primero, en negrita: «Plan B activado 1 vez:». */
  titulo: string;
  /** El detalle: «Huerto (lunes 23).». */
  texto: string;
}

/**
 * Tarjetas del bloque «Resumen del periodo», de arriba abajo: días con todo hecho (si el periodo
 * tiene más de un día), Plan B, peticiones de ayuda y, solo si los hay, tareas sin terminar o
 * bloqueadas y urgencias sin atender. Como mucho 5, para que quepan sin scroll.
 */
export function tarjetasResumen(p: ProgresoAlumno, maxDetalle = 2): TarjetaResumen[] {
  const unDia = p.desde === p.hasta;
  // En un día basta con la hora; en una semana o un mes, el día.
  const cuandoTarea = (t: TareaProgreso) =>
    unDia ? (t.hora ?? "sin hora") : textoDiaSinMes(t.fecha);
  const tarjetas: TarjetaResumen[] = [];

  if (!unDia && p.dias.length) {
    const completos = p.dias.filter((d) => d.total > 0 && d.hechas === d.total);
    const cuales =
      completos.length && completos.length <= maxDetalle
        ? ` (${unirConY(completos.map((d) => textoDiaSinMes(d.fecha)))})`
        : "";
    tarjetas.push({
      id: "dias",
      tono: "exito",
      titulo: "Días con todo hecho:",
      texto: `${completos.length} de ${p.dias.length}${cuales}.`,
    });
  }

  const conPlanB = p.tareas.filter((t) => t.plan_b);
  tarjetas.push(
    conPlanB.length
      ? {
          id: "plan-b",
          tono: "neutro",
          titulo: `Plan B activado ${vecesTexto(conPlanB.length)}:`,
          texto: `${algunos(
            conPlanB.map((t) => `${t.titulo} (${cuandoTarea(t)})`),
            maxDetalle,
          )}.`,
        }
      : { id: "plan-b", tono: "neutro", titulo: "Plan B:", texto: "no se ha activado." },
  );

  if (p.avisos.length) {
    const porNecesidad = new Map<string, number>();
    for (const a of p.avisos)
      porNecesidad.set(a.necesidad, (porNecesidad.get(a.necesidad) ?? 0) + 1);
    const grupos = [...porNecesidad.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([necesidad, n]) => `${etiquetaNecesidad(necesidad).toLowerCase()} (${n})`);
    tarjetas.push({
      id: "ayuda",
      tono: "primario",
      titulo: `Ha pedido ayuda ${vecesTexto(p.avisos.length)}:`,
      texto: `${algunos(grupos, 3)}.`,
    });
  } else {
    tarjetas.push({
      id: "ayuda",
      tono: "primario",
      titulo: "Ayuda:",
      texto: "no ha pedido ayuda.",
    });
  }

  const sinTerminar = p.tareas.filter(
    (t) => t.estado === "pendiente" && t.pendiente_motivo === "tiempo_agotado",
  );
  const bloqueadas = p.tareas.filter((t) => t.estado === "bloqueada");
  if (sinTerminar.length || bloqueadas.length) {
    const titulo =
      sinTerminar.length && bloqueadas.length
        ? "Sin terminar o bloqueadas:"
        : sinTerminar.length
          ? "Sin terminar a tiempo:"
          : "Bloqueadas:";
    const ambas = Boolean(sinTerminar.length && bloqueadas.length);
    const partes = [
      ...sinTerminar.map((t) => `${t.titulo} (${cuandoTarea(t)})`),
      ...bloqueadas.map((t) => `${t.titulo} (${ambas ? "bloqueada, " : ""}${cuandoTarea(t)})`),
    ];
    tarjetas.push({
      id: "sin-terminar",
      tono: "aviso",
      titulo,
      texto: `${algunos(partes, maxDetalle)}.`,
    });
  }

  const urgencias = p.avisos.filter((a) => a.urgencia && !a.atendido);
  if (urgencias.length) {
    // creado_en viene en UTC: el día y la hora se cuentan en la hora local de la tableta.
    const cuando = urgencias.map((a) => {
      const d = new Date(a.creado_en);
      return unDia ? `a las ${horaLocal(d)}` : `${textoDiaSinMes(aISO(d))} a las ${horaLocal(d)}`;
    });
    tarjetas.push({
      id: "urgencias",
      tono: "peligro",
      titulo:
        urgencias.length === 1
          ? "Urgencia sin atender:"
          : `${urgencias.length} urgencias sin atender:`,
      texto: `${algunos(cuando, maxDetalle)}.`,
    });
  }

  return tarjetas;
}

/** Reparte una lista en páginas de `porPagina` elementos (al menos uno por página). */
export function paginar<T>(lista: readonly T[], porPagina: number, pagina: number) {
  const tam = Math.max(1, Math.floor(porPagina));
  const paginas = Math.max(1, Math.ceil(lista.length / tam));
  const actual = Math.min(Math.max(0, pagina), paginas - 1);
  return { elementos: lista.slice(actual * tam, actual * tam + tam), pagina: actual, paginas };
}
