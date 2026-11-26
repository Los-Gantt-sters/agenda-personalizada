// Cálculos de la agenda semanal (SCRUM-124 · T-17.1, MOD HU-17, pantalla 06b).
// La semana va siempre de lunes a domingo (7 días, también sábado y domingo). Las fechas son de
// día local en formato AAAA-MM-DD, como en la agenda del día (hoyISO). Sin React, para probarlo aparte.
import { hoyISO } from "../agenda/useAgendaDia";

export const NOMBRES_DIA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/** Iniciales de la cabecera del calendario (lunes primero). */
export const INICIALES_DIA = ["L", "M", "X", "J", "V", "S", "D"] as const;

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
] as const;

/** Fecha local a partir de «AAAA-MM-DD» (a mediodía, para que el cambio de hora no mueva el día). */
export function aFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

export function sumarDias(iso: string, dias: number): string {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return hoyISO(f);
}

/** 0 = lunes … 6 = domingo. */
export function diaDeLaSemana(iso: string): number {
  return (aFecha(iso).getDay() + 6) % 7;
}

/** Lunes de la semana a la que pertenece una fecha. */
export function lunesDe(iso: string): string {
  return sumarDias(iso, -diaDeLaSemana(iso));
}

/** Los 7 días de la semana que empieza en `lunes`, de lunes a domingo. */
export function diasDeLaSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** «Del 12 al 18 de noviembre» (o «Del 30 de noviembre al 6 de diciembre» si cambia el mes). */
export function textoSemana(lunes: string): string {
  const ini = aFecha(lunes);
  const fin = aFecha(sumarDias(lunes, 6));
  if (ini.getMonth() === fin.getMonth()) {
    return `Del ${ini.getDate()} al ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
  }
  const anioFin = ini.getFullYear() === fin.getFullYear() ? "" : ` de ${fin.getFullYear()}`;
  return `Del ${ini.getDate()} de ${MESES[ini.getMonth()]} al ${fin.getDate()} de ${MESES[fin.getMonth()]}${anioFin}`;
}

/** «Noviembre 2026». */
export function textoMes(anio: number, mes: number): string {
  const nombre = MESES[mes];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

/**
 * Días de un mes para el calendario, por filas de lunes a domingo. Los huecos antes del día 1 y
 * después del último van a null. `mes` empieza en 0 (enero), como en Date.
 */
export function rejillaMes(anio: number, mes: number): (string | null)[][] {
  const primero = hoyISO(new Date(anio, mes, 1, 12));
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (string | null)[] = Array(diaDeLaSemana(primero)).fill(null);
  for (let d = 1; d <= diasMes; d++) celdas.push(hoyISO(new Date(anio, mes, d, 12)));
  while (celdas.length % 7 !== 0) celdas.push(null);
  const filas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7));
  return filas;
}

/** Mes anterior (-1) o siguiente (+1) en el calendario. */
export function moverMes(anio: number, mes: number, delta: -1 | 1): { anio: number; mes: number } {
  const f = new Date(anio, mes + delta, 1);
  return { anio: f.getFullYear(), mes: f.getMonth() };
}

/** «12 de noviembre», para leer en voz alta la tarjeta de un día. */
export function textoDiaMes(iso: string): string {
  const f = aFecha(iso);
  return `${f.getDate()} de ${MESES[f.getMonth()]}`;
}

/** «N tareas» / «1 tarea» / «Sin tareas». */
export function textoTareas(n: number): string {
  if (n === 0) return "Sin tareas";
  return n === 1 ? "1 tarea" : `${n} tareas`;
}
