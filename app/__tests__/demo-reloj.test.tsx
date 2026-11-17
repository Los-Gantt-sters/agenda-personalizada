import { act, render, screen, userEvent } from "@testing-library/react-native";

import DemoReloj from "../demo-reloj";

jest.mock("../../src/servicios/sonidos", () => ({
  reproducirSonido: jest.fn(),
}));

// La demo es una pantalla con barra de abajo (Atrás / Adelante): necesita el router.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

describe("Pantalla demo del reloj visual", () => {
  beforeEach(() => {
    // Temporizadores falsos: el test decide cuánto tiempo "pasa" sin esperar de verdad
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("muestra los relojes y el botón Reiniciar", async () => {
    await render(<DemoReloj />);

    expect(screen.getByText("Quedan 3 minutos")).toBeTruthy();
    expect(screen.getByText("Quedan 15 minutos")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeTruthy();
  });

  it("al pulsar Reiniciar el reloj vuelve a empezar", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DemoReloj />);

    // Pasan 10 s de demo (acelerada): los 3 minutos se agotan
    await act(async () => {
      jest.advanceTimersByTime(10 * 1000);
    });
    expect(screen.getByText("Se ha acabado el tiempo")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByText("Quedan 3 minutos")).toBeTruthy();
  });
});
