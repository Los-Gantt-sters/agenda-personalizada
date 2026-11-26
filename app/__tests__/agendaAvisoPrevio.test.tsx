// SCRUM-240 (pantalla 25): con «Sin aviso previo» no sale el aviso de 5 minutos (08b).
// Los dos unmount() van con await: en Testing Library 14 devuelven una promesa y, sin esperarla, el
// desmontaje se solapaba con el segundo render («overlapping act() calls»). En el CI a veces no salía
// la 08b y Jest no terminaba hasta que vencía el temporizador del aviso (SCRUM-236).
import { render, screen } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";
import { PreferenciasProvider } from "../../src/preferencias";
import { TemaProvider } from "../../src/temas";

jest.setTimeout(30_000);

jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

describe("Pantalla agenda del día: preferencia «Aviso previo» (pantalla 25)", () => {
  it("con «Sin aviso previo» (avisoPrevio: 'no' en pantalla 25) no sale el aviso de 5 minutos (08b)", async () => {
    // La tarea «Lavarse las manos» (e2) empieza a las 09:30; a las 09:25 faltan 5 minutos.
    jest.useFakeTimers({
      doNotFake: [
        "nextTick",
        "setImmediate",
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
      ],
      now: new Date(2026, 10, 5, 9, 25),
    });
    try {
      const { unmount } = await render(
        <TemaProvider>
          <PreferenciasProvider preferenciasIniciales={{ avisoPrevio: "no" }}>
            <PantallaAgenda />
          </PreferenciasProvider>
        </TemaProvider>,
      );
      // Con avisoPrevio="no" se ve la agenda normal y NO sale la pantalla 08b de aviso anticipado
      expect(await screen.findByTestId("bloque-ahora", {}, { timeout: 10_000 })).toBeTruthy();
      expect(screen.queryByTestId("pantalla-aviso")).toBeNull();
      await unmount();

      // En cambio, con avisoPrevio="si" (por defecto) a la misma hora (09:25) sí sale el aviso 08b
      const segundo = await render(
        <TemaProvider>
          <PreferenciasProvider preferenciasIniciales={{ avisoPrevio: "si" }}>
            <PantallaAgenda />
          </PreferenciasProvider>
        </TemaProvider>,
      );
      expect(await screen.findByTestId("pantalla-aviso", {}, { timeout: 10_000 })).toBeTruthy();
      await segundo.unmount();
    } finally {
      jest.useRealTimers();
    }
  });
});
