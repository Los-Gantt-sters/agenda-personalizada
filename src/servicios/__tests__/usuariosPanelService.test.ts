import { ERROR_PANEL, listarUsuariosPanel } from "../usuariosPanelService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

/** Cadena de Supabase «thenable»: cualquier método devuelve la misma cadena y al esperarla da `resultado`. */
function cadena(resultado: { data?: unknown; error?: unknown }) {
  const c: any = {};
  for (const m of ["select", "order", "eq", "neq"]) c[m] = jest.fn(() => c);
  c.then = (resolve: (v: unknown) => unknown) => resolve(resultado);
  return c;
}

/** Cada tabla devuelve sus datos. */
function prepararTablas(tablas: Record<string, { data?: unknown; error?: unknown }>) {
  mockFrom.mockImplementation((tabla: string) => cadena(tablas[tabla] ?? { data: [] }));
}

describe("usuariosPanelService - panel de administración (pantalla 48)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("junta estudiantes, tutores, familias y administración con su curso y sus vínculos", async () => {
    prepararTablas({
      cursos_lectivos: { data: [{ id: "c1", anio_escolar: "2026-2027" }] },
      aulas: {
        data: [
          { id: "au1", nombre: "Clase Triángulo", curso_lectivo_id: "c1", tutor_titular_id: "t1" },
        ],
      },
      alumnos: {
        data: [
          {
            id: "e1",
            nombre: "Alejandro",
            apellidos: "Pérez",
            dieta_comedor: "normal",
            aula_id: "au1",
            curso_lectivo_id: null,
          },
        ],
      },
      vinculos_alumno_supervisor: {
        data: [
          { alumno_id: "e1", supervisor_id: "t1", tipo_vinculo: "aula" },
          { alumno_id: "e1", supervisor_id: "f1", tipo_vinculo: "familiar" },
        ],
      },
      perfiles: {
        data: [
          { id: "t1", email: "c@p.es", nombre_completo: "Carmen Ruiz", rol: "tutor_docente" },
          { id: "f1", email: "g@c.es", nombre_completo: "Familia García", rol: "familiar" },
          { id: "m1", email: "m@p.es", nombre_completo: "Marta Soler", rol: "admin" },
        ],
      },
    });

    const r = await listarUsuariosPanel();

    expect(r.success).toBe(true);
    expect(r.data?.cursos).toEqual(["2026-2027"]);
    expect(r.data?.aulas).toEqual(["Clase Triángulo"]);
    const por = (id: string) => r.data?.usuarios.find((u) => u.id === id);
    expect(por("e1")).toMatchObject({
      nombre: "Alejandro Pérez",
      rol: "estudiante",
      cursos: ["2026-2027"], // el del aula, porque el alumno no tiene propio
      aulas: ["Clase Triángulo"],
      tutor: "Carmen Ruiz",
      familia: "Familia García",
      menu: "normal",
    });
    expect(por("t1")).toMatchObject({
      rol: "tutor",
      aulas: ["Clase Triángulo"],
      cursos: ["2026-2027"],
    });
    expect(por("f1")).toMatchObject({
      rol: "familia",
      hijos: [{ nombre: "Alejandro Pérez", aula: "Clase Triángulo" }],
    });
    expect(por("m1")).toMatchObject({ rol: "admin", cursos: [], aulas: [] });
  });

  it("sin cursos creados, la lista de cursos queda vacía", async () => {
    prepararTablas({});
    const r = await listarUsuariosPanel();
    expect(r.data?.cursos).toEqual([]);
    expect(r.data?.usuarios).toEqual([]);
  });

  it("devuelve el error si falla alguna consulta", async () => {
    prepararTablas({ alumnos: { error: { message: "sin permiso" } } });
    const r = await listarUsuariosPanel();
    expect(r).toEqual({ success: false, error: "sin permiso" });
  });

  it("devuelve un error claro si algo se rompe", async () => {
    mockFrom.mockImplementation(() => {
      throw "boom";
    });
    const r = await listarUsuariosPanel();
    expect(r).toEqual({ success: false, error: ERROR_PANEL });
  });
});
