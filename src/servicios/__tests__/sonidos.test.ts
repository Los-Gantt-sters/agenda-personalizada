// Pruebas del servicio de sonidos (HU-01, T-01.3 · SCRUM-52)
import { createAudioPlayer } from "expo-audio";

import { activarSonidos, reproducirSonido } from "../sonidos";

const crearReproductor = createAudioPlayer as jest.Mock;

describe("sonidos (SCRUM-52: T-01.3 Feedback sonoro amigable al pulsar)", () => {
  beforeEach(() => {
    activarSonidos(true);
  });

  it("reproduce el sonido desde el principio y a volumen moderado", () => {
    reproducirSonido("toque");

    const reproductor = crearReproductor.mock.results.at(-1)?.value;
    expect(reproductor.seekTo).toHaveBeenCalledWith(0);
    expect(reproductor.play).toHaveBeenCalled();
    expect(reproductor.volume).toBeLessThanOrEqual(0.6);
  });

  it("reutiliza el mismo reproductor para el mismo sonido", () => {
    reproducirSonido("acierto");
    const creados = crearReproductor.mock.calls.length;
    reproducirSonido("acierto");
    expect(crearReproductor.mock.calls.length).toBe(creados);
  });

  it("no suena nada si el tutor desactiva los sonidos", () => {
    reproducirSonido("borrar");
    const reproductor = crearReproductor.mock.results.at(-1)?.value;
    reproductor.play.mockClear();

    activarSonidos(false);
    reproducirSonido("borrar");
    expect(reproductor.play).not.toHaveBeenCalled();
  });

  it("si el dispositivo no puede reproducir, no rompe la pantalla", () => {
    crearReproductor.mockImplementationOnce(() => {
      throw new Error("audio bloqueado");
    });
    expect(() => reproducirSonido("finTiempo")).not.toThrow();
  });
});
