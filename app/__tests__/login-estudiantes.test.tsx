import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import LoginEstudiantesScreen from "../login-estudiantes";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LoginEstudiantesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el selector de clases inicialmente", async () => {
    await render(<LoginEstudiantesScreen />);

    expect(screen.getByText("¿Cuál es tu clase?")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-clase-tri")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-clase-cir")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-clase-cua")).toBeTruthy();
  });

  it("al seleccionar una clase, muestra la cuadrícula con los alumnos de esa clase", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));

    expect(screen.getByText("Clase Triángulo")).toBeTruthy();
    expect(screen.getByText("Alejandro")).toBeTruthy();
    expect(screen.getByText("Miriam")).toBeTruthy();
    // No debe mostrar alumnos de la clase círculo
    expect(screen.queryByText("Daniel")).toBeNull();
  });

  it("permite cambiar de clase volviendo a la selección inicial", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    expect(screen.getByText("Clase Triángulo")).toBeTruthy();

    await user.press(screen.getByTestId("btn-cambiar-clase"));
    expect(screen.getByText("¿Cuál es tu clase?")).toBeTruthy();
  });

  it("al tocar la foto de un alumno abre el modal de confirmación y permite acceder", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));

    expect(screen.getByText("¿Eres Alejandro?")).toBeTruthy();

    await user.press(screen.getByTestId("btn-confirmar-estudiante"));
    expect(mockPush).toHaveBeenCalledWith("/demo-reloj");
  });
});
