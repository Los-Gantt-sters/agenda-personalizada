// Servicio de sonidos de la app (base de T-T03.3). Todos los sonidos son suaves y no estridentes.
// T-01.3 (HU-01, SCRUM-52): se añaden los sonidos de feedback al pulsar en el inicio de sesión.
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

import acierto from "../../assets/sonidos/acierto.wav";
import borrar from "../../assets/sonidos/borrar.wav";
import finTiempo from "../../assets/sonidos/fin-tiempo.wav";
import refuerzo from "../../assets/sonidos/refuerzo.wav";
import toque from "../../assets/sonidos/toque.wav";

const SONIDOS = {
  /** Campanita de dos notas al acabarse el tiempo de una tarea (HU-09, RF6.7). */
  finTiempo,
  /** Arpegio suave de cuatro notas al terminar una tarea (HU-08, RF6.4). */
  refuerzo,
  /** "Pop" corto y suave al tocar una foto, una clase o un dibujo (HU-01, T-01.3). */
  toque,
  /** Dos notas ascendentes al completar los 3 dibujos de la credencial (HU-01, T-01.3). */
  acierto,
  /** Nota grave y corta al borrar un dibujo. Nunca un pitido de "error" (HU-01, T-01.3). */
  borrar,
} as const;

export type NombreSonido = keyof typeof SONIDOS;

// Un reproductor por sonido, creado la primera vez que se usa y reutilizado después
const reproductores = new Map<NombreSonido, AudioPlayer>();

// Interruptor global: el tutor puede desactivar todos los sonidos (p. ej. alumnado con hipersensibilidad auditiva)
let sonidosActivados = true;

export function activarSonidos(activar: boolean): void {
  sonidosActivados = activar;
}

export function sonidosEstanActivados(): boolean {
  return sonidosActivados;
}

/**
 * Reproduce un sonido desde el principio.
 * @param volumen de 0 (silencio) a 1; por defecto moderado
 */
export function reproducirSonido(nombre: NombreSonido, volumen = 0.6): void {
  if (!sonidosActivados) return;
  try {
    let reproductor = reproductores.get(nombre);
    if (!reproductor) {
      reproductor = createAudioPlayer(SONIDOS[nombre]);
      reproductores.set(nombre, reproductor);
    }
    reproductor.volume = volumen;
    void reproductor.seekTo(0);
    reproductor.play();
  } catch {
    // Si el dispositivo no puede reproducir (p. ej. el navegador bloquea el audio sin
    // interacción previa), se sigue sin sonido: el feedback visual basta.
  }
}
