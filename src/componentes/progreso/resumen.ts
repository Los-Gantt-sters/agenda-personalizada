// Textos e indicadores de la pantalla 43 (HU-25) a partir del progreso que da Supabase.
// Todo es lógica sin pantalla, para poder probarla sola.
import { EMOCIONES } from "../ejecucion-tarea/emociones";
import { nombreTipoMenu } from "../administracion/menus";
import { aISO, textoDiaSinMes } from "./periodos";
import type { AmbitoTarea, ProgresoAlumno, TareaProgreso } from "./tipos";

/**
 * Tono del estado en la tabla: decide los colores de la etiqueta (siempre con su texto, nunca solo
 * color). «pendiente» es el amarillo de lo que se quedó sin hacer; «neutro», el gris de lo que aún
 * no toca.
 */
export type TonoEstado = "exito" | "primario" | "pendiente" | "neutro";

export interface EstadoVisible {
  texto: string;
  tono: TonoEstado;
  icono: "check" | "reloj" | "alerta";
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

/**
 * Se le pasó la hora sin hacerla. La base la marca sola al acabar su franja (pendiente_motivo
 * «tiempo_agotado», SCRUM-265) y el tutor puede dejarla a medias («profesor»). Una pendiente de un
 * día ya pasado también cuenta (por ejemplo, las que no tienen hora, que no caducan).
 */
export function esPendiente(tarea: TareaProgreso, hoy: string): boolean {
  return tarea.estado === "pendiente" && (Boolean(tarea.pendiente_motivo) || tarea.fecha < hoy);
}

/**
 * Los cuatro estados: Hecha, En curso, Pendiente (se le pasó la hora sin hacerla) y Por hacer (aún
 * no ha llegado su hora). `hoy` es AAAA-MM-DD.
 */
export function estadoVisible(tarea: TareaProgreso, hoy: string): EstadoVisible {
  if (tarea.estado === "hecha") return { texto: "Hecha", tono: "exito", icono: "check" };
  if (tarea.estado === "en_curso") return { texto: "En curso", tono: "primario", icono: "reloj" };
  return esPendiente(tarea, hoy)
    ? { texto: "Pendiente", tono: "pendiente", icono: "alerta" }
    : { texto: "Por hacer", tono: "neutro", icono: "reloj" };
}

/** Cuántas tareas hay en cada estado (lo que no está hecho lo cuenta el indicador «Pendientes»). */
export function contarEstados(
  p: ProgresoAlumno,
  hoy: string,
): { pendientes: number; enCurso: number; porHacer: number } {
  let pendientes = 0;
  let enCurso = 0;
  let porHacer = 0;
  for (const t of p.tareas) {
    if (t.estado === "en_curso") enCurso += 1;
    else if (esPendiente(t, hoy)) pendientes += 1;
    else if (t.estado === "pendiente") porHacer += 1;
  }
  return { pendientes, enCurso, porHacer };
}

/** Lo que queda aparte de las pendientes: «Además, 1 en curso · 2 por hacer» (en una línea). */
export function detallePendientes(p: ProgresoAlumno, hoy: string): string {
  const { enCurso, porHacer } = contarEstados(p, hoy);
  const partes: string[] = [];
  if (enCurso) partes.push(`${enCurso} en curso`);
  if (porHacer) partes.push(`${porHacer} por hacer`);
  return partes.length ? `Además, ${partes.join(" · ")}` : "Nada en curso ni por hacer";
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
export type TonoTarjeta = "exito" | "neutro" | "primario" | "pendiente" | "peligro";

export interface TarjetaResumen {
  id: "comedor" | "plan-b" | "valoracion" | "ayuda" | "urgencias";
  tono: TonoTarjeta;
  /** Lo primero, en negrita: «Plan B activado 1 vez:». */
  titulo: string;
  /** El detalle: «Huerto (lunes 23).». */
  texto: string;
}

/**
 * Tarjetas del bloque «Resumen del periodo seleccionado» (boceto 43), de arriba abajo: Comedor,
 * Plan B activado y Valoración docente siempre; debajo, solo si las hay, las peticiones de ayuda y
 * las urgencias sin atender. Como mucho 5, para que quepan sin scroll. Lo pendiente ya se ve en
 * «PENDIENTES» y en la tabla, y los días completos en «Ver días». `hoy` es AAAA-MM-DD.
 */
export function tarjetasResumen(p: ProgresoAlumno, _hoy: string, maxDetalle = 2): TarjetaResumen[] {
  const unDia = p.desde === p.hasta;
  // En un día basta con la hora; en una semana o un mes, el día.
  const cuandoTarea = (t: TareaProgreso) =>
    unDia ? (t.hora ?? "sin hora") : textoDiaSinMes(t.fecha);
  const tarjetas: TarjetaResumen[] = [];

  tarjetas.push({
    id: "comedor",
    tono: "primario",
    titulo: "Comedor:",
    texto: p.dieta_comedor
      ? `menú ${nombreTipoMenu(p.dieta_comedor).toLowerCase()}.`
      : "no se sabe el menú.",
  });

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
      : { id: "plan-b", tono: "neutro", titulo: "Plan B activado:", texto: "ninguna vez." },
  );

  const v = p.valoracion;
  tarjetas.push({
    id: "valoracion",
    tono: "exito",
    titulo: "Valoración docente:",
    texto: v
      ? `«${v.texto}»${unDia ? "" : ` (${textoDiaSinMes(v.fecha)})`}.`
      : "no hay ninguna en este periodo.",
  });

  if (p.avisos.length) {
    const porNecesidad = new Map<string, number>();
    for (const a of p.avisos)
      porNecesidad.set(a.necesidad, (porNecesidad.get(a.necesidad) ?? 0) + 1);
    const grupos = [...porNecesidad.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([necesidad, n]) => `${etiquetaNecesidad(necesidad).toLowerCase()} (${n})`);
    tarjetas.push({
      id: "ayuda",
      tono: "neutro",
      titulo: `Ha pedido ayuda ${vecesTexto(p.avisos.length)}:`,
      texto: `${algunos(grupos, 3)}.`,
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
