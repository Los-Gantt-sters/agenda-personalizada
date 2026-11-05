import { render, screen, userEvent } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
}));

describe("Pantalla agenda del día (SCRUM-69: T-06.1)", () => {
  it("muestra los tres bloques con la tarea de ahora en el centro", async () => {
    await render(<PantallaAgenda />);

    expect(screen.getByTestId("bloque-hecho").props.accessibilityLabel).toBe("Hecho: Asamblea");
    expect(screen.getByTestId("bloque-ahora").props.accessibilityLabel).toBe(
      "Ahora: Lavarse las manos",
    );
    expect(screen.getByRole("button", { name: "✓ He terminado" })).toBeTruthy();
  });

  it("al pulsar una tarjeta abre su detalle y se cierra con Cerrar (RF4.4)", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);

    await user.press(screen.getByTestId("mini-e3"));
    expect(screen.getByText("Tomamos el desayuno en clase.")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "✕ Cerrar" }));
    expect(screen.queryByText("Tomamos el desayuno en clase.")).toBeNull();
  });
});
