import { act, fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";
import { reproducirSonido } from "../../src/servicios/sonidos";

// La primera prueba compila el reloj (SVG) y la agenda: sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

// El reloj visual y el refuerzo usan sonidos; en las pruebas no suenan.
jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  // Sin ?estudiante= la pantalla abre la demo con datos de ejemplo.
  useLocalSearchParams: () => ({}),
}));

const etiqueta = (id: string) => screen.getByTestId(id).props.accessibilityLabel;
const activar = (boton: ReturnType<typeof screen.getByRole>) =>
  fireEvent(boton, "accessibilityAction", { nativeEvent: { actionName: "activate" } });

describe("Pantalla agenda del día (SCRUM-69 y SCRUM-70)", () => {
  it("muestra los tres bloques con la tarea de ahora en el centro (T-06.1)", async () => {
    await render(<PantallaAgenda />);

    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea");
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    // En la demo, «Lavarse las manos» pide pulsar «Empezar» primero (HU-08, RF6.8).
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("al pulsar una tarjeta abre su detalle y se cierra con Cerrar (RF4.4)", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);

    await user.press(await screen.findByTestId("mini-e3"));
    expect(screen.getByText("Tomamos el desayuno en clase.")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "✕ Cerrar" }));
    expect(screen.queryByText("Tomamos el desayuno en clase.")).toBeNull();
  });

  it("al confirmar el fin, la tarea pasa a Hecho y la siguiente a Ahora (RF4.3, T-06.2)", async () => {
    await render(<PantallaAgenda />);
    // Con lector de pantalla basta con activar el botón (sin mantenerlo pulsado).
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await activar(await screen.findByRole("button", { name: "Terminar" }));

    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea, Lavarse las manos");
  });
});

describe("Pantalla agenda del día (SCRUM-74: T-08.1 Botones EMPEZAR / TERMINAR)", () => {
  afterEach(() => jest.useRealTimers());

  it("BDD: al mantener Empezar 1,5 s la tarea pasa a EN CURSO, se guarda la hora y arranca el reloj", async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 5, 9, 32) });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAgenda />);

    await user.longPress(await screen.findByRole("button", { name: "Empezar" }), {
      duration: 1600,
    });

    await waitFor(() =>
      expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos, en curso"),
    );
    expect(screen.getByText("Empezaste a las 9:32")).toBeTruthy();
    expect(screen.getByLabelText(/^Reloj visual:/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
  });

  it("un toque corto en Empezar no hace nada (RNF6.1)", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAgenda />);

    await user.longPress(await screen.findByRole("button", { name: "Empezar" }), {
      duration: 300,
    });
    await act(() => jest.advanceTimersByTime(2000));

    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    expect(screen.queryByRole("button", { name: "Terminar" })).toBeNull();
  });

  it("BDD: al pulsar Terminar sale el refuerzo positivo con sonido y Seguir vuelve a la agenda", async () => {
    await render(<PantallaAgenda />);
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await activar(await screen.findByRole("button", { name: "Terminar" }));

    expect(await screen.findByText("¡Muy bien!")).toBeTruthy();
    expect(screen.getByText("Has terminado: Lavarse las manos")).toBeTruthy();
    expect(reproducirSonido).toHaveBeenCalledWith("refuerzo", expect.any(Number));

    await userEvent.setup().press(screen.getByRole("button", { name: "Seguir ➜" }));
    await waitFor(() => expect(screen.queryByText("¡Muy bien!")).toBeNull());
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno");
  });

  it("si el tutor no pide registrar el inicio (RF6.8), sale directamente Terminar", async () => {
    await render(<PantallaAgenda />);
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await activar(await screen.findByRole("button", { name: "Terminar" }));
    await userEvent.setup().press(await screen.findByRole("button", { name: "Seguir ➜" }));

    // «Desayuno» no lo pide.
    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
  });

  it("no hay ningún campo de texto para el estudiante (RNF6.4)", async () => {
    await render(<PantallaAgenda />);
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    expect(JSON.stringify(screen.toJSON())).not.toContain('"type":"TextInput"');
  });
});
