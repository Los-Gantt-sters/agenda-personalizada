// Lógica de la agenda del día (T-06.1, HU-06): ordena las tareas (RF4.1) y las reparte en
// «Hecho», «Ahora» y «Después» (RF4.2). Sin React ni Supabase, para poder probarla aparte.
import type { BloquesAgenda, EntradaAgenda } from "./tipos";

/** Normaliza "09:00:00" o "9:00" a "09:00". */
export function normalizarHora(hora: string): string {
  const [h = "0", m = "0"] = hora.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function aMinutos(hora: string): number {
  const [h, m] = normalizarHora(hora).split(":").map(Number);
  return h * 60 + m;
}

function deMinutos(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** "9:00 a 9:45", para mostrar en la tarjeta. */
export function franjaHoraria(entrada: EntradaAgenda): string {
  const inicio = aMinutos(entrada.hora_inicio);
  return `${deMinutos(inicio)} a ${deMinutos(inicio + entrada.duracion_prevista_min)}`;
}

export function horaCorta(entrada: EntradaAgenda): string {
  return deMinutos(aMinutos(entrada.hora_inicio));
}

/**
 * RF4.1: secuencia cronológica ordenada. Primero por hora de inicio; si dos
 * tareas empiezan a la vez, decide el campo `orden` que pone el tutor.
 * Las tareas canceladas no se muestran.
 */
export function ordenarSecuencia(entradas: readonly EntradaAgenda[]): EntradaAgenda[] {
  return entradas
    .filter((e) => e.estado !== "cancelada")
    .slice()
    .sort(
      (a, b) =>
        aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio) ||
        a.orden - b.orden ||
        a.id.localeCompare(b.id),
    );
}

/**
 * Índice de la tarea de «Ahora»: la que está en curso o, si no hay, la
 * primera pendiente. Las bloqueadas por el tutor se saltan.
 */
export function indiceAhora(secuencia: readonly EntradaAgenda[]): number {
  const enCurso = secuencia.findIndex((e) => e.estado === "en_curso");
  if (enCurso >= 0) return enCurso;
  return secuencia.findIndex((e) => e.estado === "pendiente");
}

export interface OpcionesBloques {
  /** Cuántas tareas hechas enseñar como máximo (las más recientes). */
  maxHecho?: number;
  /** Cuántas tareas siguientes enseñar como máximo. */
  maxDespues?: number;
}

/** RF4.2: reparte la secuencia del día en «Hecho», «Ahora» y «Después». */
export function dividirEnBloques(
  entradas: readonly EntradaAgenda[],
  { maxHecho = 2, maxDespues = 2 }: OpcionesBloques = {},
): BloquesAgenda {
  const secuencia = ordenarSecuencia(entradas);
  const i = indiceAhora(secuencia);
  const hechas = secuencia.filter((e) => e.estado === "hecha");

  if (i < 0) {
    return {
      hecho: hechas.slice(-maxHecho),
      ahora: null,
      despues: [],
      // Si solo quedan bloqueadas, el día tampoco tiene nada que hacer ahora.
      diaTerminado: true,
    };
  }

  const despues = secuencia
    .slice(i + 1)
    .filter((e) => e.estado !== "hecha")
    .slice(0, maxDespues);

  return {
    hecho: hechas.slice(-maxHecho),
    ahora: secuencia[i],
    despues,
    diaTerminado: false,
  };
}
