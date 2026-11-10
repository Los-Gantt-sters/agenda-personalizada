import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginEstudiantesScreen from "../login-estudiantes";
import { obtenerAlumnoTableta, recordarAlumnoTableta } from "../../src/servicios/tabletaPersonal";

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

  it("al tocar los 3 dibujos del alumno entrega el array de dibujos y redirige", async () => {
    const user = userEvent.setup();
    const callbackJaime = jest.fn();
    await render(<LoginEstudiantesScreen alCompletarCredencialVisual={callbackJaime} />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));

    expect(screen.getByText("¿Eres Alejandro?")).toBeTruthy();
    expect(screen.getByText("🔑 Toca tus 3 dibujos en orden")).toBeTruthy();

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));

    expect(callbackJaime).toHaveBeenCalledWith("ale", ["manzana", "perro", "estrella"]);
  });

  describe("modo tableta personal (SCRUM-52: T-01.3)", () => {
    beforeEach(async () => {
      await AsyncStorage.clear();
    });

    it("si la tableta recuerda a un alumno, abre directamente su credencial de 3 dibujos", async () => {
      await recordarAlumnoTableta("ale");
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      expect(await screen.findByText("¿Eres Alejandro?")).toBeTruthy();
    });

    it("tras entrar, la tableta recuerda al alumno", async () => {
      const user = userEvent.setup();
      await render(
        <LoginEstudiantesScreen modoTabletaPersonal alCompletarCredencialVisual={jest.fn()} />,
      );

      await user.press(screen.getByTestId("tarjeta-clase-tri"));
      await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
      await user.press(screen.getByTestId("dibujo-credencial-manzana"));
      await user.press(screen.getByTestId("dibujo-credencial-perro"));
      await user.press(screen.getByTestId("dibujo-credencial-estrella"));

      expect(await obtenerAlumnoTableta()).toBe("ale");
    });

    it("«No soy yo» hace que la tableta olvide al alumno y vuelve a la cuadrícula", async () => {
      const user = userEvent.setup();
      await recordarAlumnoTableta("ale");
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      await user.press(await screen.findByTestId("btn-cancelar-estudiante"));

      expect(await obtenerAlumnoTableta()).toBeNull();
      expect(screen.getByText("Clase Triángulo")).toBeTruthy();
    });

    it("en tableta compartida (por defecto) no recuerda a nadie", async () => {
      await recordarAlumnoTableta("ale");
      await render(<LoginEstudiantesScreen />);

      expect(screen.getByText("¿Cuál es tu clase?")).toBeTruthy();
      expect(screen.queryByText("¿Eres Alejandro?")).toBeNull();
    });
  });
});
