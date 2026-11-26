import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Pantalla } from "..";
import type { AuthSession, UserRole } from "../../tipos/auth";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock("../../preferencias/PreferenciasProvider", () => ({
  usePreferenciasOpcional: () => ({
    preferencias: { canal: "ambos", caja: "normal" },
    estilos: { fuenteNormal: "System", fuenteNegrita: "System" },
  }),
}));
jest.mock("../../preferencias/PantallaVistaAccesible", () => ({
  PantallaVistaAccesible: () => null,
}));

// «Ayuda» solo se pinta si existe su proveedor: aquí lo damos por hecho.
jest.mock("../../necesidades/ProveedorNecesidades", () => ({
  useNecesidadesOpcional: () => ({ abrirModalNecesidades: jest.fn(), varianteBoton: "A" }),
}));
jest.mock("../../necesidades/BotonNecesidades", () => {
  const { Text: T } = jest.requireActual("react-native");
  return { BotonNecesidades: () => <T testID="btn-necesidades">Ayuda</T> };
});

// Sesión que ve la pantalla: la cambia cada prueba.
let mockSesion: AuthSession | null = null;
jest.mock("../../sesion/SesionProvider", () => ({
  useSesionOpcional: () => ({ sesion: mockSesion, cargando: false, cerrarSesion: jest.fn() }),
}));

const ALUMNO = "3f2b8c1e-7d4a-4e9b-9c55-0a1b2c3d4e5f";
const sesionDe = (role: UserRole, email: string): AuthSession => ({
  accessToken: "t",
  user: { id: "u1", email, fullName: "X", role },
});

const pintar = () =>
  render(
    <Pantalla titulo="Mi agenda">
      <Text>contenido</Text>
    </Pantalla>,
  );

describe("SCRUM-230: Ayuda y Preferencias solo con alumno con sesión iniciada", () => {
  afterEach(() => {
    mockSesion = null;
    jest.clearAllMocks();
  });

  it("sin sesión (pantallas de entrar 01-05) no sale ninguno", async () => {
    await pintar();
    expect(screen.queryByTestId("btn-necesidades")).toBeNull();
    expect(screen.queryByTestId("btn-barra-preferencias")).toBeNull();
  });

  it.each(["tutor_docente", "familiar", "admin", "especialista"] as const)(
    "con sesión de %s no sale ninguno",
    async (rol) => {
      mockSesion = sesionDe(rol, "adulto@colegio.es");
      await pintar();
      expect(screen.queryByTestId("btn-necesidades")).toBeNull();
      expect(screen.queryByTestId("btn-barra-preferencias")).toBeNull();
    },
  );

  it("con sesión de alumno salen «Ayuda» y «Preferencias»", async () => {
    mockSesion = sesionDe("estudiante", `alu-${ALUMNO}@alumnos.agensible`);
    await pintar();
    expect(screen.getByTestId("btn-necesidades")).toBeTruthy();
    expect(screen.getByTestId("btn-barra-preferencias").props.accessibilityLabel).toBe(
      "Preferencias: cómo se ve la app",
    );
  });
});
