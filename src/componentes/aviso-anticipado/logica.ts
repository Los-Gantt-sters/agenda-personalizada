// Lógica del aviso anticipatorio (T-16.1, HU-16): qué tarea viene y cuándo hay que avisar (RF4.6).
// Sin React, para poder probarla aparte.
import type { EntradaAgenda } from "../agenda/tipos";
import { normalizarHora, ordenarSecuencia } from "../agenda/logica";
import type { EventoAviso, PreferenciasAviso } from "./tipos";

const MINUTO_MS = 60_000;

/** Momento en que empieza la entrada, en la hora local del dispositivo. */
export function momentoInicio(entrada: EntradaAgenda): Date {
  const [a, mes, dia] = entrada.fecha.split("-").map(Number);
  const [h, m] = normalizarHora(entrada.hora_inicio).split(":").map(Number);
  return new Date(a, mes - 1, dia, h, m);
}

/** Momento en que hay que avisar: la hora de inicio menos la antelación. */
export function momentoAviso(entrada: EntradaAgenda, antelacionMin: number): Date {
  return new Date(momentoInicio(entrada).getTime() - antelacionMin * MINUTO_MS);
}

/**
 * La siguiente tarea: la primera pendiente que todavía no ha empezado según la hora. Las hechas,
 * en curso, canceladas y bloqueadas no cuentan. `excluir` quita las que ya se han avisado.
 */
export function siguienteTarea(
  entradas: readonly EntradaAgenda[],
  ahora: Date,
  excluir: (e: EntradaAgenda) => boolean = () => false,
): EntradaAgenda | null {
  return (
    ordenarSecuencia(entradas).find(
      (e) =>
        e.estado === "pendiente" && momentoInicio(e).getTime() > ahora.getTime() && !excluir(e),
    ) ?? null
  );
}

/** true si ya ha llegado la hora de avisar y la tarea aún no ha empezado. */
export function tocaAvisar(entrada: EntradaAgenda, ahora: Date, antelacionMin: number): boolean {
  const t = ahora.getTime();
  return (
    momentoAviso(entrada, antelacionMin).getTime() <= t && t < momentoInicio(entrada).getTime()
  );
}

/**
 * Clave para avisar una sola vez por tarea. Lleva la hora: si el tutor la mueve, se vuelve a avisar
 * a la hora nueva.
 */
export function claveAviso(entrada: EntradaAgenda): string {
  return `${entrada.id}@${entrada.fecha} ${normalizarHora(entrada.hora_inicio)}`;
}

/** RI4.2: datos del aviso que se emite. */
export function crearEventoAviso(
  entrada: EntradaAgenda,
  preferencias: Pick<PreferenciasAviso, "antelacionMin" | "tipo">,
  ahora: Date,
): EventoAviso {
  return {
    estudiante_id: entrada.estudiante_id,
    tarea_id: entrada.tarea_id,
    entrada_id: entrada.id,
    antelacion_min: preferencias.antelacionMin,
    tipo: preferencias.tipo,
    emitido_en: ahora.toISOString(),
    entrada,
  };
}
