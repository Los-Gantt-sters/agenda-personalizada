// Ruta /progreso: pantalla 43 «Progreso e historial» (HU-25 · SCRUM-146).
import { fireEvent, render, screen } from "@testing-library/react-native";

import PantallaProgreso from "../progreso";
import { supabase } from "../../src/lib/supabaseClient";

const ALUMNO = "11111111-2222-3333-4444-555555555555";

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) };
let mockParametros: { estudiante?: string } = {};
let mockRol: string | undefined;

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParametros,
}));

jest.mock("../../src/sesion", () => ({
  useSesionOpcional: () => (mockRol ? { sesion: { user: { role: mockRol } } } : null),
}));

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe("ruta /progreso (pantalla 43)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParametros = {};
    mockRol = undefined;
  });

  it("sin ?estudiante= abre la demo, sin llamar a Supabase", async () => {
    await render(<PantallaProgreso />);

    expect(await screen.findByText("Progreso e historial · Alejandro")).toBeTruthy();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("con el id de un alumno real pide su progreso de esta semana a Supabase", async () => {
    mockParametros = { estudiante: ALUMNO };
    mockRpc.mockResolvedValue({
      data: { alumno: { id: ALUMNO, nombre: "Miriam" }, tareas: [] },
      error: null,
    });

    await render(<PantallaProgreso />);

    expect(await screen.findByText("Progreso e historial · Miriam")).toBeTruthy();
    expect(mockRpc).toHaveBeenCalledWith(
      "progreso_alumno",
      expect.objectContaining({ p_estudiante: ALUMNO }),
    );
    const { p_desde, p_hasta } = mockRpc.mock.calls[0][1];
    expect(new Date(`${p_desde}T12:00`).getDay()).toBe(1); // lunes
    expect(new Date(`${p_hasta}T12:00`).getDay()).toBe(0); // domingo
  });

  it("«Atrás» vuelve atrás o, tras recargar, al panel de cada adulto", async () => {
    mockRol = "familiar";
    await render(<PantallaProgreso />);
    await screen.findByText("Progreso e historial · Alejandro");

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/familiar/resumen");

    mockRouter.canGoBack.mockReturnValueOnce(true);
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
