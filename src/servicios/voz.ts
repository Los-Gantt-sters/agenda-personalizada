// Servicio de voz de la app (HUT-03, T-T03.3): lee en voz alta los textos de tareas y pasos (RF14.3,
// RF14.5). Es el único punto que usa la síntesis de voz, para que todas las pantallas suenen igual.
// expo-speech usa la voz del navegador en web y la del sistema si se genera la app para tabletas.
// Los nombres `leer` y `puedeLeer` son los que usaba el detalle de la tarea (HU-06, hoy PantallaTarea), para que solo
// haya que importarlos de aquí.
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export const IDIOMA_VOZ = "es-ES";
/** Algo más despacio que lo normal, para facilitar la comprensión (Lectura Fácil). */
export const VELOCIDAD_LECTURA_FACIL = 0.9;

export interface OpcionesVoz {
  /** 1 es la velocidad normal; por defecto, VELOCIDAD_LECTURA_FACIL. */
  velocidad?: number;
  /** Se llama cuando termina de leer (no si se interrumpe). */
  alTerminar?: () => void;
}

/** En web depende del navegador; en la app nativa siempre hay voz del sistema. */
function hayVoz(): boolean {
  if (Platform.OS !== "web") return true;
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * true si el dispositivo puede leer en voz alta: sirve para ocultar el botón «Escuchar» si no.
 * Se calcula una vez al cargar la app, porque no cambia mientras está abierta.
 */
export const puedeLeer = hayVoz();

/**
 * Lee un texto en voz alta. Corta lo que estuviera diciendo antes, para que no se pisen dos
 * frases (p. ej. al pulsar «Escuchar otra vez»). Si no hay voz o algo falla, no hace nada.
 */
export function leer(texto: string, { velocidad, alTerminar }: OpcionesVoz = {}): void {
  const limpio = texto.trim();
  if (!limpio || !puedeLeer) return;

  try {
    void Speech.stop();
    const maximo = Speech.maxSpeechInputLength;
    Speech.speak(Number.isFinite(maximo) ? limpio.slice(0, maximo) : limpio, {
      language: IDIOMA_VOZ,
      rate: velocidad ?? VELOCIDAD_LECTURA_FACIL,
      onDone: alTerminar,
      // Un fallo de voz no debe interrumpir al alumno: la información también está en pantalla
      onError: () => {},
    });
  } catch {
    // Sin voz: el texto sigue visible en pantalla
  }
}

/** Calla la voz (p. ej. al salir de una pantalla). */
export function detenerVoz(): void {
  try {
    void Speech.stop();
  } catch {
    // Nada que detener
  }
}
