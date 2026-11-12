import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginEstudiantesScreen from "../login-estudiantes";
import { signInEstudianteConDibujos } from "../../src/servicios/authService";
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
const MENSAJE = "No es esa. Prueba otra vez";

async function abrirCredencialDeAlejandro(user: ReturnType<typeof userEvent.setup>) {
  await user.press(screen.getByTestId("tarjeta-clase-tri"));
  await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
}

async function tocarDibujos(user: ReturnType<typeof userEvent.setup>, ...slugs: string[]) {
  for (const slug of slugs) {
    await user.press(screen.getByTestId(`dibujo-credencial-${slug}`));
  }
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

  it("si la secuencia es incorrecta no entra, avisa y deja la secuencia vacía", async () => {
    mockLogin.mockResolvedValue(FALLO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");

    expect(await screen.findByText(`⚠️ ${MENSAJE}`)).toBeTruthy();
    expect(screen.getByLabelText("0 de 3 dibujos seleccionados")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("tras un error se puede volver a intentar y entrar", async () => {
    mockLogin.mockResolvedValueOnce(FALLO).mockResolvedValueOnce(EXITO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");
    await screen.findByText(`⚠️ ${MENSAJE}`);
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

    expect(await screen.findByText(`⚠️ ${MENSAJE}`)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("«No soy yo» quita el aviso de error", async () => {
    mockLogin.mockResolvedValue(FALLO);
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await abrirCredencialDeAlejandro(user);
    await tocarDibujos(user, "sol", "coche", "casa");
    await screen.findByText(`⚠️ ${MENSAJE}`);
    await user.press(screen.getByTestId("btn-cancelar-estudiante"));
    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));

    expect(screen.queryByText(`⚠️ ${MENSAJE}`)).toBeNull();
  });

  describe("modo tableta personal", () => {
    it("solo recuerda al alumno si ha entrado de verdad", async () => {
      mockLogin.mockResolvedValue(FALLO);
      const user = userEvent.setup();
      await render(<LoginEstudiantesScreen modoTabletaPersonal />);

      await abrirCredencialDeAlejandro(user);
      await tocarDibujos(user, "sol", "coche", "casa");
      await screen.findByText(`⚠️ ${MENSAJE}`);

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
