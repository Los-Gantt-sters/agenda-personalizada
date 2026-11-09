// Servicio temporizador del aviso anticipatorio (T-16.1, HU-16).
// RF4.6: programa un temporizador para la hora de inicio de la siguiente tarea menos 5 minutos y, al
// llegar, emite el aviso (RI4.2). Se vuelve a programar cuando cambia la agenda (el tutor mueve o
// bloquea una tarea) y al volver a la app (tableta que se apagó, pestaña en segundo plano).
// Cada tarea se avisa una sola vez. Si la app se abre con menos de 5 minutos, se avisa al momento.
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { EntradaAgenda } from "../agenda/tipos";
import { claveAviso, crearEventoAviso, momentoAviso, siguienteTarea, tocaAvisar } from "./logica";
import { AVISO_POR_DEFECTO, type EventoAviso, type PreferenciasAviso } from "./tipos";

// Aunque falte mucho, se revisa cada minuto: el navegador retrasa los temporizadores de las
// pestañas en segundo plano y el reloj del dispositivo puede cambiar.
const REVISION_MAX_MS = 60_000;

export function useAvisoAnticipado(
  entradas: readonly EntradaAgenda[],
  preferencias: PreferenciasAviso = AVISO_POR_DEFECTO,
  /** Se llama con cada aviso emitido (p. ej. para guardarlo, RI4.2). */
  onAviso?: (evento: EventoAviso) => void,
) {
  const [aviso, setAviso] = useState<EventoAviso | null>(null);
  const avisadas = useRef(new Set<string>());

  // Se guarda la última versión del callback para no tener que repetir el efecto cuando cambie
  const onAvisoRef = useRef(onAviso);
  useEffect(() => {
    onAvisoRef.current = onAviso;
  });

  const { activado, antelacionMin, tipo } = preferencias;

  useEffect(() => {
    if (!activado) return;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const programar = () => {
      clearTimeout(temporizador);
      const ahora = new Date();
      const siguiente = siguienteTarea(entradas, ahora, (e) => avisadas.current.has(claveAviso(e)));
      if (!siguiente) return;
      const espera = Math.max(
        0,
        momentoAviso(siguiente, antelacionMin).getTime() - ahora.getTime(),
      );
      temporizador = setTimeout(
        () => {
          const momento = new Date();
          if (tocaAvisar(siguiente, momento, antelacionMin)) {
            avisadas.current.add(claveAviso(siguiente));
            const evento = crearEventoAviso(siguiente, { antelacionMin, tipo }, momento);
            setAviso(evento);
            onAvisoRef.current?.(evento);
          }
          programar();
        },
        Math.min(espera, REVISION_MAX_MS),
      );
    };

    programar();
    const sub = AppState.addEventListener("change", (s) => s === "active" && programar());
    return () => {
      clearTimeout(temporizador);
      sub.remove();
    };
  }, [entradas, activado, antelacionMin, tipo]);

  /** Quita el aviso de la pantalla. No cambia nada de la agenda. */
  const cerrar = useCallback(() => setAviso(null), []);

  return { aviso, cerrar };
}
