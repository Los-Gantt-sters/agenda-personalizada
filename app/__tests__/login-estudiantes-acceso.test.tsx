import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginEstudiantesScreen from "../login-estudiantes";
import { signInEstudianteConDibujos } from "../../src/servicios/authService";
import { destinoTrasLoginAlumno } from "../../src/servicios/destinoAgendaAlumno";
import { obtenerAlumnoTableta } from "../../src/servicios/tabletaPersonal";
import type { AuthResult } from "../../src/tipos/auth";

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

// Se sustituye el login de Supabase por una función falsa que decide si la secuencia es correcta
jest.mock("../../src/servicios/authService", () => ({
  signInEstudianteConDibujos: jest.fn(),
}));
const mockLogin = signInEstudianteConDibujos as jest.MockedFunction<
  typeof signInEstudianteConDibujos
>;

// SCRUM-227: la ruta de la agenda la decide destinoAgendaAlumno (con alumnos de ejemplo, la demo)
jest.mock("../../src/servicios/destinoAgendaAlumno", () => ({
  destinoTrasLoginAlumno: jest.fn(async () => "/agenda"),
}));
const mockDestino = destinoTrasLoginAlumno as jest.MockedFunction<typeof destinoTrasLoginAlumno>;

const EXITO: AuthResult = {
  success: true,
  session: {
    accessToken: "token-de-prueba",
    user: {
      id: "u-ale",
      email: "alu-ale@alumnos.agensible",
      fullName: "Alejandro",
      role: "estudiante",
    },
  },
};
const FALLO: AuthResult = { success: false, error: "La secuencia de dibujos no coincide." };
const MENSAJE = "Esos dibujos no son los tuyos.";

async function abrirCredencialDeAlejandro(user: ReturnType<typeof userEvent.setup>) {
  await user.press(screen.getByTestId("tarjeta-clase-tri"));
  await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
}

/** Toca los dibujos y pulsa «Entrar» (ya no entra sola al tocar el tercero). */
async function tocarDibujos(user: ReturnType<typeof userEvent.setup>, ...slugs: string[]) {
  for (const slug of slugs) {
    await user.press(screen.getByTestId(`dibujo-credencial-${slug}`));
  }
  await user.press(screen.getByTestId("btn-entrar-credencial"));
}

describe("LoginEstudiantesScreen - SCRUM-51 (T-01.2, acceso con 3 dibujos)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("comprueba la secuencia con Supabase y, si es correcta, entra en la agenda", async () => {
    mockLogin.mockResolvedValue(EXITO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "manzana", "perro", "estrella");

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/agenda"));
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith("ale", ["manzana", "perro", "estrella"]);
  });

  it("SCRUM-227: tras entrar, lleva al alumno a la agenda que le corresponde", async () => {
    mockLogin.mockResolvedValue(EXITO);
    mockDestino.mockResolvedValueOnce("/agenda?estudiante=id-real&vista=semanal");
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "manzana", "perro", "estrella");

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/agenda?estudiante=id-real&vista=semanal"),
    );
    expect(mockDestino).toHaveBeenCalledWith("ale");
  });

  it("si la secuencia es incorrecta no entra y enseña la pantalla 04b (SCRUM-248)", async () => {
    mockLogin.mockResolvedValue(FALLO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");

    expect(await screen.findByText(MENSAJE)).toBeTruthy();
    // Los 3 dibujos se quedan a la vista y no salen «Borrar dibujo» ni «Entrar»
    expect(screen.getByLabelText("3 de 3 dibujos seleccionados")).toBeTruthy();
    expect(screen.queryByTestId("btn-borrar-dibujo")).toBeNull();
    expect(screen.queryByTestId("btn-entrar-credencial")).toBeNull();
    expect(screen.getByTestId("btn-borrar-todo")).toBeTruthy();
    // «Adelante» tampoco vuelve a probar los mismos dibujos
    expect(screen.getByTestId("btn-barra-adelante")).toBeDisabled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("tras el error, «Borrar todo» vacía los huecos y quita el aviso", async () => {
    mockLogin.mockResolvedValue(FALLO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");
    await screen.findByText(MENSAJE);
    await user.press(screen.getByTestId("btn-borrar-todo"));

    expect(screen.queryByText(MENSAJE)).toBeNull();
    expect(screen.getByLabelText("0 de 3 dibujos seleccionados")).toBeTruthy();
    expect(screen.getByTestId("btn-borrar-dibujo")).toBeTruthy();
    expect(screen.getByTestId("btn-entrar-credencial")).toBeDisabled();
  });

  it("tras un error se puede volver a intentar y entrar", async () => {
    mockLogin.mockResolvedValueOnce(FALLO).mockResolvedValueOnce(EXITO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");
    await screen.findByText(MENSAJE);
    await user.press(screen.getByTestId("btn-borrar-todo"));
    await tocarDibujos(user, "manzana", "perro", "estrella");

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/agenda"));
    expect(mockLogin).toHaveBeenLastCalledWith("ale", ["manzana", "perro", "estrella"]);
  });

  it("un fallo de conexión se trata igual que una secuencia incorrecta", async () => {
    mockLogin.mockRejectedValue(new Error("sin red"));
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "manzana", "perro", "estrella");

    expect(await screen.findByText(MENSAJE)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("«Atrás» (no soy yo) quita el aviso de error", async () => {
    mockLogin.mockResolvedValue(FALLO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");
    await screen.findByText(MENSAJE);
    await user.press(screen.getByTestId("btn-barra-atras"));
    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));

    expect(screen.queryByText(MENSAJE)).toBeNull();
  });

  describe("modo tableta personal", () => {
    it("solo recuerda al alumno si ha entrado de verdad", async () => {
      mockLogin.mockResolvedValue(FALLO);
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      await abrirCredencialDeAlejandro(user);
      await tocarDibujos(user, "sol", "coche", "casa");
      await screen.findByText(MENSAJE);

      expect(await obtenerAlumnoTableta()).toBeNull();
    });

    it("tras entrar con la secuencia correcta, la tableta recuerda al alumno", async () => {
      mockLogin.mockResolvedValue(EXITO);
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      await abrirCredencialDeAlejandro(user);
      await tocarDibujos(user, "manzana", "perro", "estrella");

      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
      expect(await obtenerAlumnoTableta()).toBe("ale");
    });
  });
});
