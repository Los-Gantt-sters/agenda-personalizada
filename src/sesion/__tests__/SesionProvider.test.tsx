import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { SesionProvider, useSesion } from "../SesionProvider";
import { getCurrentSession, signOutSupervisor } from "../../servicios/authService";
import type { AuthSession } from "../../tipos/auth";

// Supabase falso: guarda la función que escucha los cambios para poder «avisar» desde el test
const mockAvisos: (() => void)[] = [];
const mockDesuscribir = jest.fn();
jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn((escuchar: () => void) => {
        mockAvisos.push(escuchar);
        return { data: { subscription: { unsubscribe: mockDesuscribir } } };
      }),
    },
  },
}));

jest.mock("../../servicios/authService", () => ({
  getCurrentSession: jest.fn(),
  signOutSupervisor: jest.fn(),
}));
const mockSesionActual = getCurrentSession as jest.Mock;
const mockCerrar = signOutSupervisor as jest.Mock;

const ADMIN: AuthSession = {
  accessToken: "token",
  expiresAt: 9_999_999_999,
  user: { id: "u1", email: "admin@purisima.es", fullName: "Gonzalo Navas", role: "admin" },
};

/** Pantalla mínima que enseña lo que sabe del estado global de la sesión. */
function Consumidor() {
  const { sesion, cargando, cerrarSesion } = useSesion();
  return (
    <>
      <Text>{cargando ? "cargando" : sesion ? `rol: ${sesion.user.role}` : "sin sesión"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Salir" onPress={cerrarSesion}>
        <Text>Salir</Text>
      </Pressable>
    </>
  );
}

const pintar = () =>
  render(
    <SesionProvider>
      <Consumidor />
    </SesionProvider>,
  );

describe("SesionProvider - HUT-03 (T-T03.1, estado global de la sesión)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAvisos.length = 0;
  });

  it("al arrancar comprueba si ya hay sesión", async () => {
    mockSesionActual.mockResolvedValue(ADMIN);
    await pintar();

    expect(await screen.findByText("rol: admin")).toBeTruthy();
    expect(mockSesionActual).toHaveBeenCalledTimes(1);
  });

  it("mientras comprueba, indica que está cargando", async () => {
    mockSesionActual.mockReturnValue(new Promise(() => {}));
    await pintar();

    expect(screen.getByText("cargando")).toBeTruthy();
  });

  it("se actualiza sola cuando alguien inicia sesión", async () => {
    mockSesionActual.mockResolvedValueOnce(null).mockResolvedValueOnce(ADMIN);
    await pintar();
    await screen.findByText("sin sesión");

    await act(async () => {
      mockAvisos[0]();
    });

    expect(await screen.findByText("rol: admin")).toBeTruthy();
  });

  it("«cerrarSesión» cierra la sesión en Supabase y la borra del estado", async () => {
    mockSesionActual.mockResolvedValue(ADMIN);
    mockCerrar.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    await pintar();
    await screen.findByText("rol: admin");

    await user.press(screen.getByRole("button", { name: "Salir" }));

    expect(mockCerrar).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("sin sesión")).toBeTruthy());
  });

  it("deja de escuchar a Supabase al desmontarse", async () => {
    mockSesionActual.mockResolvedValue(null);
    const { unmount } = await pintar();
    await screen.findByText("sin sesión");

    await unmount();

    expect(mockDesuscribir).toHaveBeenCalledTimes(1);
  });

  it("useSesion fuera del proveedor da un error claro", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(render(<Consumidor />)).rejects.toThrow(
      "useSesion debe usarse dentro de <SesionProvider>",
    );
  });
});
