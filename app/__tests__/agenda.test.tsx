import { fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  // Sin ?estudiante= la pantalla abre la demo con datos de ejemplo.
  useLocalSearchParams: () => ({}),
}));

const etiqueta = (id: string) => screen.getByTestId(id).props.accessibilityLabel;

describe("Pantalla agenda del día (SCRUM-69 y SCRUM-70)", () => {
  it("muestra los tres bloques con la tarea de ahora en el centro (T-06.1)", async () => {
    await render(<PantallaAgenda />);

    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea");
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    expect(screen.getByRole("button", { name: "✓ He terminado" })).toBeTruthy();
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
    const boton = await screen.findByRole("button", { name: "✓ He terminado" });

    // Con lector de pantalla basta con activar el botón (sin mantenerlo pulsado).
    await fireEvent(boton, "accessibilityAction", { nativeEvent: { actionName: "activate" } });

    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea, Lavarse las manos");
  });
});
