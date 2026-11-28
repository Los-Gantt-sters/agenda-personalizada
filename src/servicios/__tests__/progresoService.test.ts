import { obtenerProgresoAlumno, repositorioProgresoSupabase } from "../progresoService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

const mockRpc = supabase.rpc as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

/** Consulta encadenada de supabase-js: cada tabla responde con lo que se le diga. */
function consultas(respuestas: Record<string, { data: unknown; error: unknown }>) {
  mockFrom.mockImplementation((tabla: string) => {
    const r = respuestas[tabla] ?? { data: null, error: null };
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte", "lte", "not", "order"]) q[m] = jest.fn(() => q);
    q.maybeSingle = jest.fn(async () => r);
    q.limit = jest.fn(async () => r);
    return q;
  });
}
const ALUMNO = "11111111-2222-3333-4444-555555555555";

describe("progresoService - SCRUM-146 (pantalla 43, HU-25)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consultas({});
  });

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
    // Sin menú ni observaciones en la base, las tarjetas lo dicen (null).
    expect(r).toEqual({ ...respuesta, dieta_comedor: null, valoracion: null });
    expect(repositorioProgresoSupabase.obtener).toBe(obtenerProgresoAlumno);
  });

  it("si la base trae alguna tarea «bloqueada» (esquema inicial), la cuenta como pendiente", async () => {
    const tarea = {
      id: "t1",
      fecha: "2026-11-24",
      hora: "10:00",
      titulo: "Taller",
      ambito: "centro",
      estado: "bloqueada",
      pendiente_motivo: null,
      plan_b: false,
      emocion: null,
      inicio_real: null,
      fin_real: null,
    };
    mockRpc.mockResolvedValue({
      data: {
        resumen: {
          total: 2,
          hechas: 1,
          pendientes: 0,
          en_curso: 0,
          bloqueadas: 1,
          sin_terminar: 0,
        },
        tareas: [tarea],
      },
      error: null,
    });

    const r = await obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29");

    expect(r.tareas[0]).toMatchObject({ estado: "pendiente", pendiente_motivo: "tiempo_agotado" });
    expect(r.resumen).toEqual({
      total: 2,
      hechas: 1,
      pendientes: 1,
      en_curso: 0,
      sin_terminar: 1,
      planes_b: 0,
    });
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

  it("añade el menú del comedor y la última observación del periodo (boceto 43)", async () => {
    mockRpc.mockResolvedValue({ data: { tareas: [] }, error: null });
    consultas({
      alumnos: { data: { dieta_comedor: "sin_gluten" }, error: null },
      ejecuciones: {
        data: [
          { observaciones: "  ", inicio: "2026-11-25T09:00:00Z" },
          { observaciones: "Trabaja con mucha autonomía", inicio: "2026-11-24T10:00:00Z" },
        ],
        error: null,
      },
    });

    const r = await obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29");

    expect(mockFrom).toHaveBeenCalledWith("alumnos");
    expect(mockFrom).toHaveBeenCalledWith("ejecuciones");
    expect(r.dieta_comedor).toBe("sin_gluten");
    expect(r.valoracion).toEqual({ texto: "Trabaja con mucha autonomía", fecha: "2026-11-24" });
  });

  it("si no se pueden leer el menú o las observaciones, la pantalla sigue (null)", async () => {
    mockRpc.mockResolvedValue({ data: { tareas: [] }, error: null });
    consultas({
      alumnos: { data: null, error: { message: "sin permiso" } },
      ejecuciones: { data: null, error: { message: "sin permiso" } },
    });

    const r = await obtenerProgresoAlumno(ALUMNO, "2026-11-23", "2026-11-29");

    expect(r.dieta_comedor).toBeNull();
    expect(r.valoracion).toBeNull();
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
