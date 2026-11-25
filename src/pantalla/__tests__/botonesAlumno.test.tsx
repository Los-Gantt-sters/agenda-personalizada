import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { Pantalla } from "..";
import { obtenerPermisoPreferencias } from "../../servicios/permisoPreferencias";
import type { AuthSession, UserRole } from "../../tipos/auth";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
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

jest.mock("../../servicios/permisoPreferencias", () => ({
  ...jest.requireActual("../../servicios/permisoPreferencias"),
  obtenerPermisoPreferencias: jest.fn(async () => true),
}));
const permiso = obtenerPermisoPreferencias as jest.Mock;

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

  it("con sesión de alumno salen «Ayuda» y «Preferencias», y «Preferencias» abre el menú 16", async () => {
    mockSesion = sesionDe("estudiante", `alu-${ALUMNO}@alumnos.agensible`);
    await pintar();
    expect(screen.getByTestId("btn-necesidades")).toBeTruthy();
    const boton = await screen.findByTestId("btn-barra-preferencias");
    expect(boton.props.accessibilityLabel).toBe("Preferencias: cómo se ve la app");
    expect(permiso).toHaveBeenCalledWith(ALUMNO);

    await fireEvent.press(boton);
    expect(mockPush).toHaveBeenCalledWith("/preferencias");
  });

  it("si en Permisos (26d) no tiene permiso, sale «Ayuda» pero no «Preferencias»", async () => {
    permiso.mockResolvedValueOnce(false);
    mockSesion = sesionDe("estudiante", `alu-${ALUMNO}@alumnos.agensible`);
    await pintar();
    await waitFor(() => expect(permiso).toHaveBeenCalled());
    expect(screen.getByTestId("btn-necesidades")).toBeTruthy();
    expect(screen.queryByTestId("btn-barra-preferencias")).toBeNull();
  });
});
