// Servicio de sonidos de la app (base de T-T03.3). Todos los sonidos son suaves y no estridentes.
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

import finTiempo from "../../assets/sonidos/fin-tiempo.wav";

const SONIDOS = {
  /** Campanita de dos notas al acabarse el tiempo de una tarea (HU-09, RF6.7). */
  finTiempo,
} as const;

export type NombreSonido = keyof typeof SONIDOS;

// Un reproductor por sonido, creado la primera vez que se usa y reutilizado después
const reproductores = new Map<NombreSonido, AudioPlayer>();

/**
 * Reproduce un sonido desde el principio.
 * @param volumen de 0 (silencio) a 1; por defecto moderado
 */
export function reproducirSonido(nombre: NombreSonido, volumen = 0.6): void {
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
    // interacción previa), se sigue sin sonido: el aviso visual del reloj basta.
  }
}
