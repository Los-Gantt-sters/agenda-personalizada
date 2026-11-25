import { obtenerProgresoAlumno, repositorioProgresoSupabase } from "../progresoService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn() },
}));

const mockRpc = supabase.rpc as jest.Mock;
const ALUMNO = "11111111-2222-3333-4444-555555555555";

describe("progresoService - SCRUM-146 (pantalla 43, HU-25)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("llama a progreso_alumno con el alumno y el periodo", async () => {
    const respuesta = {
      alumno: { id: ALUMNO, nombre: "Alejandro" },
      desde: "2026-11-23",
      hasta: "2026-11-29",
      resumen: {
        total: 2,
        hechas: 1,
        pendientes: 1,
        en_curso: 0,
        bloqueadas: 0,
        sin_terminar: 0,
        planes_b: 0,
      },
      emociones: [{ emocion: "contento", total: 1 }],
      dias: [{ fecha: "2026-11-23", total: 2, hechas: 1 }],
      tareas: [],
      avisos: [],
    };
    mockRpc.mockResolvedValue({ data: respuesta, error: null });

    const r = await obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29");

    expect(mockRpc).toHaveBeenCalledWith("progreso_alumno", {
      p_estudiante: ALUMNO,
      p_desde: "2026-11-23",
      p_hasta: "2026-11-29",
    });
    expect(r).toEqual(respuesta);
    expect(repositorioProgresoSupabase.obtener).toBe(obtenerProgresoAlumno);
  });

  it("si faltan partes de la respuesta, las rellena vacías", async () => {
    mockRpc.mockResolvedValue({ data: { resumen: { total: 0 } }, error: null });

    const r = await obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-23");

    expect(r).toMatchObject({
      alumno: null,
      desde: "2026-11-23",
      hasta: "2026-11-23",
      emociones: [],
      dias: [],
      tareas: [],
      avisos: [],
    });
    expect(r.resumen).toMatchObject({ total: 0, hechas: 0, sin_terminar: 0, planes_b: 0 });
  });

  it("traduce los errores a mensajes en Lectura Fácil", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "x" } });
    await expect(obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29")).rejects.toThrow(
      "No tienes permiso para ver el progreso de este alumno.",
    );

    mockRpc.mockResolvedValueOnce({ data: null, error: { code: "22023", message: "x" } });
    await expect(obtenerProgresoAlumno(ALUMNO, "2026-11-29", "2026-11-23")).rejects.toThrow(
      "Ese periodo no es válido. Elige otro.",
    );

    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "Failed to fetch" } });
    await expect(obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29")).rejects.toThrow(
      /No se ha podido cargar el progreso/,
    );
  });
});
