// Periodos de la pantalla 43 (HU-25): un día, una semana (de lunes a domingo) o un mes.
// Las fechas van como texto AAAA-MM-DD en hora local, igual que en la agenda, para no tener
// problemas de zona horaria. Los nombres de días y meses van escritos aquí y no con Intl, para que
// salgan igual en la tableta, en el navegador y en las pruebas.

export type TipoPeriodo = "dia" | "semana" | "mes";

export interface Periodo {
  tipo: TipoPeriodo;
  /** Primer día, AAAA-MM-DD. */
  desde: string;
  /** Último día, AAAA-MM-DD (incluido). */
  hasta: string;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Date local a AAAA-MM-DD. */
export function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

/** AAAA-MM-DD a Date local (a mediodía: así un cambio de hora nunca lo pasa a otro día). */
export function deISO(fecha: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

function sumarDias(fecha: string, dias: number): string {
  const d = deISO(fecha);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

/** El periodo de ese tipo que contiene la fecha (por defecto, hoy). */
export function periodoQueContiene(tipo: TipoPeriodo, fecha: Date | string = new Date()): Periodo {
  const d = typeof fecha === "string" ? deISO(fecha) : new Date(fecha);
  if (tipo === "dia") {
    const dia = aISO(d);
    return { tipo, desde: dia, hasta: dia };
  }
  if (tipo === "semana") {
    // La semana empieza el lunes: getDay() da 0 el domingo.
    const desdeLunes = (d.getDay() + 6) % 7;
    const desde = sumarDias(aISO(d), -desdeLunes);
    return { tipo, desde, hasta: sumarDias(desde, 6) };
  }
  const desde = aISO(new Date(d.getFullYear(), d.getMonth(), 1, 12));
  const hasta = aISO(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
  return { tipo, desde, hasta };
}

/** El periodo anterior (pasos = -1) o siguiente (pasos = 1) del mismo tipo. */
export function moverPeriodo(periodo: Periodo, pasos: number): Periodo {
  if (periodo.tipo === "dia") return periodoQueContiene("dia", sumarDias(periodo.desde, pasos));
  if (periodo.tipo === "semana")
    return periodoQueContiene("semana", sumarDias(periodo.desde, 7 * pasos));
  const d = deISO(periodo.desde);
  return periodoQueContiene("mes", new Date(d.getFullYear(), d.getMonth() + pasos, 1, 12));
}

/** Cambia de día a semana o mes (o al revés) sin perder de vista la fecha en la que se estaba. */
export function cambiarTipo(periodo: Periodo, tipo: TipoPeriodo, hoy: Date = new Date()): Periodo {
  if (tipo === periodo.tipo) return periodo;
  // Si el periodo de ahora contiene hoy, se va al de hoy; si no, al que contiene su primer día.
  const contieneHoy = periodo.desde <= aISO(hoy) && aISO(hoy) <= periodo.hasta;
  return periodoQueContiene(tipo, contieneHoy ? hoy : periodo.desde);
}

/** true si el periodo es el de hoy (este día, esta semana o este mes). */
export function esPeriodoActual(periodo: Periodo, hoy: Date = new Date()): boolean {
  return periodo.desde === periodoQueContiene(periodo.tipo, hoy).desde;
}

/** true si el periodo es posterior al de hoy: no tiene historial todavía. */
export function esPeriodoFuturo(periodo: Periodo, hoy: Date = new Date()): boolean {
  return periodo.desde > periodoQueContiene(periodo.tipo, hoy).desde;
}

/** «Jueves 26 de noviembre». */
export function textoDia(fecha: string): string {
  const d = deISO(fecha);
  return mayuscula(`${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`);
}

/** «jueves 26»: para las frases del resumen, dentro de un periodo que ya dice el mes. */
export function textoDiaSinMes(fecha: string): string {
  const d = deISO(fecha);
  return `${DIAS[d.getDay()]} ${d.getDate()}`;
}

/** «Jue 26»: para la tabla, donde hay poco sitio. */
export function textoDiaCorto(fecha: string): string {
  const d = deISO(fecha);
  return mayuscula(`${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`);
}

/**
 * Nombre del periodo en Lectura Fácil, con el año porque se puede ir a años anteriores:
 * «Hoy, jueves 26 de noviembre de 2026», «Esta semana: del 23 al 29 de noviembre de 2026»…
 */
export function textoPeriodo(periodo: Periodo, hoy: Date = new Date()): string {
  const actual = esPeriodoActual(periodo, hoy);
  if (periodo.tipo === "dia") {
    const dia = `${textoDia(periodo.desde)} de ${deISO(periodo.desde).getFullYear()}`;
    return actual ? `Hoy, ${dia.charAt(0).toLowerCase()}${dia.slice(1)}` : dia;
  }
  if (periodo.tipo === "semana") {
    const a = deISO(periodo.desde);
    const b = deISO(periodo.hasta);
    const fin = `${b.getDate()} de ${MESES[b.getMonth()]} de ${b.getFullYear()}`;
    const rango =
      a.getMonth() === b.getMonth()
        ? `del ${a.getDate()} al ${fin}`
        : a.getFullYear() === b.getFullYear()
          ? `del ${a.getDate()} de ${MESES[a.getMonth()]} al ${fin}`
          : `del ${a.getDate()} de ${MESES[a.getMonth()]} de ${a.getFullYear()} al ${fin}`;
    if (actual) return `Esta semana: ${rango}`;
    if (esPeriodoActual(moverPeriodo(periodo, 1), hoy)) return `Semana anterior: ${rango}`;
    return mayuscula(rango);
  }
  const d = deISO(periodo.desde);
  const mes = `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  return actual ? `Este mes: ${mes}` : mayuscula(mes);
}

/** «Noviembre»: nombre del mes (0 = enero) para el calendario. */
export function nombreMes(mes: number): string {
  return mayuscula(MESES[mes]);
}

/** El periodo de un mes concreto (0 = enero). */
export function periodoDelMes(anio: number, mes: number): Periodo {
  return periodoQueContiene("mes", new Date(anio, mes, 1, 12));
}

/**
 * Filas del calendario de un mes: cada una es una semana de lunes a domingo (AAAA-MM-DD), desde la
 * que contiene el día 1 hasta la que contiene el último. Son 4, 5 o 6 filas.
 */
export function semanasDelMes(anio: number, mes: number): string[][] {
  const { desde, hasta } = periodoDelMes(anio, mes);
  const filas: string[][] = [];
  for (let lunes = periodoQueContiene("semana", desde).desde; lunes <= hasta;) {
    const fila = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
    filas.push(fila);
    lunes = sumarDias(lunes, 7);
  }
  return filas;
}
