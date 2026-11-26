import {
  activarPlanB,
  cargarPlanB,
  ERROR_SIN_PERMISO_PLAN_B,
  vincularPlanB,
} from "../planBService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({ supabase: { from: jest.fn() } }));

// Consulta encadenable de Supabase: cada método devuelve la misma consulta y al final se resuelve.
function consultaFalsa(resultado: { data?: unknown; error: unknown }) {
  const q: Record<string, jest.Mock> & { then?: unknown } = {} as never;
  for (const m of ["select", "eq", "neq", "order", "update", "in"]) q[m] = jest.fn(() => q);
  q.then = (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(ok, ko);
  return q;
}

const from = supabase.from as unknown as jest.Mock;

const tarea = (id: string, titulo: string, extra: object = {}) => ({
  id,
  titulo,
  pictograma_url: null,
  hora_inicio: null,
  ambito: "centro",
  alumno_id: null,
  plan_b_tarea_id: null,
  activo: true,
  ...extra,
});
const asignacion = (id: string, tareaId: string, extra: object = {}) => ({
  id,
  tarea_id: tareaId,
  hora_inicio: "11:30:00",
  estado: "pendiente",
  plan_b_activado: false,
  plan_b_tarea_id: null,
  ...extra,
});

const TAREAS = [
  tarea("recreo", "Recreo"),
  tarea("juegos", "Juegos en clase"),
  tarea("cuento", "Cuento"),
  tarea("casa", "Merienda", { ambito: "hogar" }),
  tarea("de-luc", "Tarea de Lucas", { alumno_id: "luc" }),
];

const conDatos = (asignaciones: unknown[]) =>
  from.mockImplementation((t: string) =>
    consultaFalsa({ data: t === "tareas" ? TAREAS : asignaciones, error: null }),
  );

describe("planBService (SCRUM-138)", () => {
  afterEach(() => jest.clearAllMocks());

  it("agrupa la clase por tarea y hora; está activo solo si lo está en todos", async () => {
    conDatos([
      asignacion("a1", "recreo", { plan_b_tarea_id: "juegos", plan_b_activado: true }),
      asignacion("a2", "recreo", { plan_b_tarea_id: "juegos" }),
    ]);

    const { filas } = await cargarPlanB(["ale", "luc"], "2026-11-26");

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      asignacionIds: ["a1", "a2"],
      titulo: "Recreo",
      hora: "11:30",
      planB: { id: "juegos", titulo: "Juegos en clase", pictogramaUrl: null },
      activo: false,
    });
  });

  it("no enseña las tareas terminadas ni las de casa; ordena por hora", async () => {
    conDatos([
      asignacion("a1", "recreo"),
      asignacion("a2", "cuento", { hora_inicio: "09:00:00" }),
      asignacion("a3", "juegos", { estado: "hecho" }),
      asignacion("a4", "casa"),
    ]);

    const { filas } = await cargarPlanB(["ale"], "2026-11-26");

    expect(filas.map((f) => f.titulo)).toEqual(["Cuento", "Recreo"]);
  });

  it("la biblioteca de la clase es solo el catálogo común; la de un alumno añade las suyas", async () => {
    conDatos([]);
    const clase = await cargarPlanB(["ale", "luc"], "2026-11-26");
    expect(clase.biblioteca.map((t) => t.id)).toEqual(["recreo", "juegos", "cuento"]);
    const uno = await cargarPlanB(["luc"], "2026-11-26");
    expect(uno.biblioteca.map((t) => t.id)).toContain("de-luc");
  });

  it("vincula la tarea Plan B en todas las asignaciones", async () => {
    const q = consultaFalsa({ data: [{ id: "a1" }, { id: "a2" }], error: null });
    from.mockReturnValue(q);

    await vincularPlanB(["a1", "a2"], "juegos");

    expect(q.update).toHaveBeenCalledWith({ plan_b_tarea_id: "juegos" });
    expect(q.in).toHaveBeenCalledWith("id", ["a1", "a2"]);
  });

  it("avisa si la base de datos no deja cambiar alguna", async () => {
    from.mockReturnValue(consultaFalsa({ data: [], error: null }));
    await expect(vincularPlanB(["a1"], "juegos")).rejects.toThrow(ERROR_SIN_PERMISO_PLAN_B);
  });

  it("al activar desbloquea la tarea; al desactivar no toca el estado", async () => {
    const q = consultaFalsa({ data: [{ id: "a1" }], error: null });
    from.mockReturnValue(q);

    await activarPlanB(["a1"], true);
    expect(q.update).toHaveBeenCalledWith({ plan_b_activado: true });
    expect(q.update).toHaveBeenCalledWith({ estado: "pendiente" });
    expect(q.eq).toHaveBeenCalledWith("estado", "bloqueada");

    q.update.mockClear();
    await activarPlanB(["a1"], false);
    expect(q.update).toHaveBeenCalledTimes(1);
    expect(q.update).toHaveBeenCalledWith({ plan_b_activado: false });
  });
});
