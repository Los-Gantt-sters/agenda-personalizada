import * as Speech from "expo-speech";

import { IDIOMA_VOZ, VELOCIDAD_LECTURA_FACIL, detenerVoz, leer, puedeLeer } from "../voz";

// expo-speech falso: así se comprueba qué se pide leer sin sonar de verdad
jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  maxSpeechInputLength: 4000,
}));
const mockSpeak = Speech.speak as jest.Mock;
const mockStop = Speech.stop as jest.Mock;

/**
 * Vuelve a cargar voz.ts desde cero en el sistema indicado (puedeLeer se calcula al cargarlo).
 * isolateModules carga copias nuevas de react-native y expo-speech, así que el sistema se cambia
 * y la voz se vigila sobre esas copias.
 */
function cargarVoz(sistema: "web" | "ios") {
  let voz!: typeof import("../voz");
  let speak!: jest.Mock;
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-require-imports -- isolateModules necesita require */
    jest.replaceProperty(require("react-native").Platform, "OS", sistema);
    speak = require("expo-speech").speak;
    voz = require("../voz");
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
  return { voz, speak };
}

describe("voz - HUT-03 (T-T03.3, síntesis de voz)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lee el texto en español y a velocidad de Lectura Fácil", () => {
    leer("Lávate las manos");

    expect(mockSpeak).toHaveBeenCalledWith(
      "Lávate las manos",
      expect.objectContaining({ language: IDIOMA_VOZ, rate: VELOCIDAD_LECTURA_FACIL }),
    );
  });

  it("corta lo que estuviera diciendo antes de empezar", () => {
    leer("Primera frase");
    leer("Segunda frase");

    expect(mockStop).toHaveBeenCalledTimes(2);
    expect(mockSpeak).toHaveBeenLastCalledWith("Segunda frase", expect.anything());
  });

  it("permite otra velocidad y avisar al terminar", () => {
    const alTerminar = jest.fn();
    leer("Muy bien", { velocidad: 1, alTerminar });

    expect(mockSpeak).toHaveBeenCalledWith(
      "Muy bien",
      expect.objectContaining({ rate: 1, onDone: alTerminar }),
    );
  });

  it("no lee textos vacíos", () => {
    leer("   ");

    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it("recorta los textos más largos de lo que admite el sistema", () => {
    leer("a".repeat(5000));

    expect(mockSpeak.mock.calls[0][0]).toHaveLength(4000);
  });

  it("si la voz falla no rompe la pantalla", () => {
    mockSpeak.mockImplementationOnce(() => {
      throw new Error("sin voz");
    });

    expect(() => leer("Hola")).not.toThrow();
  });

  it("detenerVoz calla la voz", () => {
    detenerVoz();

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("en la app nativa siempre se puede leer", () => {
    expect(puedeLeer).toBe(true);
  });

  describe("en web", () => {
    it("se puede leer si el navegador tiene síntesis de voz", () => {
      Object.defineProperty(window, "speechSynthesis", { value: {}, configurable: true });
      const { voz, speak } = cargarVoz("web");

      expect(voz.puedeLeer).toBe(true);
      voz.leer("Hola");
      expect(speak).toHaveBeenCalledTimes(1);
    });

    it("sin síntesis de voz en el navegador no intenta leer", () => {
      // @ts-expect-error -- se quita para simular un navegador sin voz
      delete window.speechSynthesis;
      const { voz, speak } = cargarVoz("web");

      expect(voz.puedeLeer).toBe(false);
      voz.leer("Hola");
      expect(speak).not.toHaveBeenCalled();
    });
  });
});
