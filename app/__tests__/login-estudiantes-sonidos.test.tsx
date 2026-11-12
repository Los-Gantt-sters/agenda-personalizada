// Feedback sonoro coherente en los botones de navegación del login de alumno (HU-01, T-01.3 · SCRUM-52)
import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";

import LoginEstudiantesScreen from "../login-estudiantes";
import { reproducirSonido } from "../../src/servicios/sonidos";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const sonar = reproducirSonido as jest.Mock;

describe("LoginEstudiantesScreen (SCRUM-52: T-01.3 sonido en todos los botones)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("el acceso de los adultos suena y lleva al acceso para adultos", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);
    await user.press(screen.getByTestId("btn-acceso-supervisores"));
    expect(sonar).toHaveBeenCalledWith("toque");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("«Atrás» (barra de abajo) suena igual que elegir una clase", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);
    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    sonar.mockClear();
    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(sonar).toHaveBeenCalledWith("toque");
    expect(screen.getByText("¿Cuál es tu clase?")).toBeTruthy();
  });
});
