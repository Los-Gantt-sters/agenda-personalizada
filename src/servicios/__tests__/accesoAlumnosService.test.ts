// SCRUM-249 (T-01.7): aulas y alumnos del acceso visual desde la base de datos, sin sesión.
import { obtenerAlumnosAcceso, obtenerAulasAcceso, usaBaseDatos } from "../accesoAlumnosService";
import { supabase } from "../../lib/supabaseClient";

const mockConfigurado = { valor: true };
jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn() },
  get supabaseConfigurado() {
    return mockConfigurado.valor;
  },
}));

const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => {
  mockRpc.mockReset();
  mockConfigurado.valor = true;
});

describe("obtenerAulasAcceso (pantalla 01)", () => {
  it("llama a aulas_acceso y convierte las filas", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: "a1", nombre: "Clase Círculo", icono_forma: "cir", icono_url: null, orden: 0 },
        { id: "a2", nombre: "Clase Sol", icono_forma: "tri", icono_url: "https://picto/sol.png" },
      ],
      error: null,
    });

    await expect(obtenerAulasAcceso()).resolves.toEqual({
      estado: "ok",
      datos: [
        { id: "a1", nombre: "Clase Círculo", iconoForma: "cir", iconoUrl: null },
        { id: "a2", nombre: "Clase Sol", iconoForma: "tri", iconoUrl: "https://picto/sol.png" },
      ],
    });
    expect(mockRpc).toHaveBeenCalledWith("aulas_acceso", undefined);
  });

  it("si la base de datos da error, lo dice (la pantalla avisa, no usa datos de prueba)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "sin permiso" } });
    await expect(obtenerAulasAcceso()).resolves.toEqual({ estado: "error" });
  });

  it("sin conexión devuelve error en vez de lanzarlo", async () => {
    mockRpc.mockRejectedValue(new Error("sin red"));
    await expect(obtenerAulasAcceso()).resolves.toEqual({ estado: "error" });
  });

  it("sin Supabase configurado no llama a la base de datos", async () => {
    mockConfigurado.valor = false;
    expect(usaBaseDatos()).toBe(false);
    await expect(obtenerAulasAcceso()).resolves.toEqual({ estado: "sin-supabase" });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe("obtenerAlumnosAcceso (pantalla 02)", () => {
  it("llama a alumnos_acceso con el aula y convierte las filas (sin foto)", async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: "al1", nombre: "Alejandro", icono_personal: "🦁", color_identificativo: "#B8492F" },
        { id: "al2", nombre: "Miriam", icono_personal: null, color_identificativo: null },
      ],
      error: null,
    });

    await expect(obtenerAlumnosAcceso("a1")).resolves.toEqual({
      estado: "ok",
      datos: [
        { id: "al1", nombre: "Alejandro", icono: "🦁", color: "#B8492F" },
        { id: "al2", nombre: "Miriam", icono: null, color: null },
      ],
    });
    expect(mockRpc).toHaveBeenCalledWith("alumnos_acceso", { p_aula: "a1" });
  });

  it("si la base de datos da error, lo dice", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "fallo" } });
    await expect(obtenerAlumnosAcceso("a1")).resolves.toEqual({ estado: "error" });
  });
});
