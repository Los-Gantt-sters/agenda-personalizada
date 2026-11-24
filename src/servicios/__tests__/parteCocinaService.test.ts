import { ERROR_PARTE_COCINA, obtenerParteCocina } from "../parteCocinaService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe("parteCocinaService - SCRUM-261 (parte diario de Cocina)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("llama a la función parte_cocina y devuelve el parte con el formato de la app", async () => {
    mockRpc.mockResolvedValue({
      data: {
        total: 34,
        menus: [
          { tipo: "normal", total: 28 },
          { tipo: "sin_gluten", total: 2 },
          { tipo: "turmix", total: 4 },
        ],
        avisos: [
          {
            alumno_id: "a1",
            nombre: "Miriam",
            apellidos: "Núñez",
            aula: "Clase Triángulo",
            alergias: ["frutos_secos"],
            observaciones: "Pan sin gluten precintado",
          },
          {
            alumno_id: "a2",
            nombre: "Sergio",
            apellidos: null,
            aula: null,
            alergias: [],
            observaciones: null,
          },
        ],
      },
      error: null,
    });

    const r = await obtenerParteCocina();

    expect(mockRpc).toHaveBeenCalledWith("parte_cocina");
    expect(r.success).toBe(true);
    expect(r.data?.total).toBe(34);
    expect(r.data?.menus).toEqual([
      { tipo: "normal", total: 28 },
      { tipo: "sin_gluten", total: 2 },
      { tipo: "turmix", total: 4 },
    ]);
    expect(r.data?.avisos[0]).toEqual({
      alumnoId: "a1",
      nombre: "Miriam",
      apellidos: "Núñez",
      aula: "Clase Triángulo",
      alergias: ["frutos_secos"],
      observaciones: "Pan sin gluten precintado",
    });
    // Lo que llega vacío (null) se deja como valor vacío
    expect(r.data?.avisos[1]).toEqual({
      alumnoId: "a2",
      nombre: "Sergio",
      apellidos: undefined,
      aula: undefined,
      alergias: [],
      observaciones: "",
    });
  });

  it("devuelve un parte vacío si todavía no hay alumnos", async () => {
    mockRpc.mockResolvedValue({ data: { total: 0, menus: [], avisos: [] }, error: null });
    const r = await obtenerParteCocina();
    expect(r).toEqual({ success: true, data: { total: 0, menus: [], avisos: [] } });
  });

  it("convierte en números los totales que lleguen como texto", async () => {
    mockRpc.mockResolvedValue({
      data: { total: "3", menus: [{ tipo: "normal", total: "3" }], avisos: [] },
      error: null,
    });
    const r = await obtenerParteCocina();
    expect(r.data?.total).toBe(3);
    expect(r.data?.menus[0].total).toBe(3);
  });

  it("devuelve el error de Supabase", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "sin permiso" } });
    expect(await obtenerParteCocina()).toEqual({ success: false, error: "sin permiso" });
  });

  it("avisa si la respuesta llega vacía", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    expect(await obtenerParteCocina()).toEqual({ success: false, error: ERROR_PARTE_COCINA });
  });

  it("devuelve el mensaje si la llamada lanza una excepción", async () => {
    mockRpc.mockRejectedValue(new Error("sin red"));
    expect(await obtenerParteCocina()).toEqual({ success: false, error: "sin red" });
  });
});
