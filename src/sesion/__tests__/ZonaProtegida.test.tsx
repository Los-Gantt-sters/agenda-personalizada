import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ZonaProtegida } from "../ZonaProtegida";
import { useSesion } from "../SesionProvider";
import type { AuthSession } from "../../tipos/auth";

// Ruta actual y redirección de expo-router simuladas
let mockRuta = "/admin/vinculos";
jest.mock("expo-router", () => {
  const { Text: TextoRN } = jest.requireActual("react-native");
  return {
    usePathname: () => mockRuta,
    Redirect: ({ href }: { href: string }) => <TextoRN>{`redirige a ${href}`}</TextoRN>,
  };
});

jest.mock("../SesionProvider", () => ({ useSesion: jest.fn() }));
const mockUseSesion = useSesion as jest.Mock;

const sesionCon = (role: AuthSession["user"]["role"]): AuthSession => ({
  accessToken: "token",
  expiresAt: 9_999_999_999,
  user: { id: "u1", email: "x@purisima.es", fullName: "X", role },
});

const pintar = () =>
  render(
    <ZonaProtegida>
      <Text>Contenido privado</Text>
    </ZonaProtegida>,
  );

describe("ZonaProtegida - HUT-03 (T-T03.1, protección de rutas por rol)", () => {
  beforeEach(() => {
    mockRuta = "/admin/vinculos";
  });

  it("mientras se comprueba la sesión no enseña nada privado", async () => {
    mockUseSesion.mockReturnValue({ sesion: null, cargando: true });
    await pintar();

    expect(screen.getByText("Comprobando…")).toBeTruthy();
    expect(screen.queryByText("Contenido privado")).toBeNull();
  });

  it("sin sesión manda al login", async () => {
    mockUseSesion.mockReturnValue({ sesion: null, cargando: false });
    await pintar();

    expect(screen.getByText("redirige a /login")).toBeTruthy();
    expect(screen.queryByText("Contenido privado")).toBeNull();
  });

  it("con un rol que no toca (familia en /admin) manda al login", async () => {
    mockUseSesion.mockReturnValue({ sesion: sesionCon("familiar"), cargando: false });
    await pintar();

    expect(screen.getByText("redirige a /login")).toBeTruthy();
  });

  it("con sesión caducada manda al login", async () => {
    const caducada = { ...sesionCon("admin"), expiresAt: 1 };
    mockUseSesion.mockReturnValue({ sesion: caducada, cargando: false });
    await pintar();

    expect(screen.getByText("redirige a /login")).toBeTruthy();
  });

  it("el administrador entra en /admin", async () => {
    mockUseSesion.mockReturnValue({ sesion: sesionCon("admin"), cargando: false });
    await pintar();

    expect(screen.getByText("Contenido privado")).toBeTruthy();
  });

  it("un tutor docente entra en /docente", async () => {
    mockRuta = "/docente/agenda";
    mockUseSesion.mockReturnValue({ sesion: sesionCon("tutor_docente"), cargando: false });
    await pintar();

    expect(screen.getByText("Contenido privado")).toBeTruthy();
  });
});
