// Lógica de la agenda del día (T-06.1, HU-06): ordena las tareas (RF4.1) y las reparte en
// «Hecho», «Ahora» y «Después» (RF4.2). T-06.2 añade el avance al confirmar (RF4.3).
// Sin React ni Supabase, para poder probarla aparte.
import type { BloquesAgenda, EntradaAgenda } from "./tipos";

/** Normaliza "09:00:00" o "9:00" a "09:00". Una tarea sin hora fija se queda con "". */
export function normalizarHora(hora: string | null | undefined): string {
  if (!hora) return "";
  const [h = "0", m = "0"] = hora.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

/** Las tareas sin hora fija van al final del día (como en secuencia_dia, SCRUM-71). */
const SIN_HORA = 24 * 60;

function aMinutos(hora: string): number {
  if (!hora) return SIN_HORA;
  const [h, m] = normalizarHora(hora).split(":").map(Number);
  return h * 60 + m;
}

function deMinutos(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** "9:00 a 9:45", para mostrar en la tarjeta. */
export function franjaHoraria(entrada: EntradaAgenda): string {
  if (!entrada.hora_inicio) return "Sin hora fija";
  const inicio = aMinutos(entrada.hora_inicio);
  return `${deMinutos(inicio)} a ${deMinutos(inicio + entrada.duracion_prevista_min)}`;
}

export function horaCorta(entrada: EntradaAgenda): string {
  if (!entrada.hora_inicio) return "Sin hora";
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

/**
 * RF4.3: al confirmar el fin de la tarea actual, pasa a «Hecho». La siguiente
 * queda automáticamente en «Ahora» porque es la primera pendiente.
 * Si el id no es la tarea de «Ahora» (doble pulsación, dato viejo), no cambia nada.
 */
export function confirmarFin(
  entradas: readonly EntradaAgenda[],
  idEntrada: string,
): EntradaAgenda[] {
  const secuencia = ordenarSecuencia(entradas);
  const actual = secuencia[indiceAhora(secuencia)];
  if (!actual || actual.id !== idEntrada) return entradas.slice();
  return entradas.map((e) => (e.id === idEntrada ? { ...e, estado: "hecha" } : e));
}
