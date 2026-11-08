// Tiempo que lleva en curso la tarea, para mover el reloj visual (T-08.1, HU-08; RF6.1).
import { useEffect, useState } from "react";

/** Milisegundos entre `inicio` (ISO 8601) y `ahora`; 0 si no hay inicio o no es una fecha. */
export function msDesde(inicio: string | null | undefined, ahora: number = Date.now()): number {
  if (!inicio) return 0;
  const t = Date.parse(inicio);
  return Number.isNaN(t) ? 0 : Math.max(0, ahora - t);
}

/**
 * Milisegundos desde `inicio` (ISO 8601), actualizados cada segundo. Con `inicio` nulo vale 0.
 * Se calcula desde la hora guardada, así que si la app se recarga el reloj sigue donde iba.
 */
export function useTranscurrido(inicio: string | null | undefined, cadaMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!inicio) return;
    const id = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(id);
  }, [inicio, cadaMs]);

  // Justo al empezar, `ahora` puede ser de antes del inicio: msDesde no baja de 0.
  return msDesde(inicio, ahora);
}
